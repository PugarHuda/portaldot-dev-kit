"""Decode a failed Portaldot transaction into a structured, named error.

A failed extrinsic emits a ``System.ExtrinsicFailed`` event carrying a
``DispatchError``. substrate-interface already resolves that DispatchError
against chain metadata and exposes it via ``ExtrinsicReceipt.error_message``
(error name + doc comment). FailLens builds on that: it wraps the receipt's
error into a :class:`DecodedError` and, for a bare tx hash, locates the
receipt by scanning recent blocks.

NOTE: the chain-facing functions below are written against the documented
substrate-interface API but have NOT yet been run against a live Portaldot
node. Validate them in task #4 once the Day-1 gate is passed.
"""

from __future__ import annotations

from dataclasses import dataclass

from substrateinterface import ExtrinsicReceipt, SubstrateInterface

from pdk.config import RECENT_BLOCKS_SCAN


@dataclass
class DecodedError:
    """A fully decoded, human-readable extrinsic error."""

    pallet: str  # e.g. "Balances" — "Unknown" if the error carries no type
    name: str  # e.g. "InsufficientBalance"
    docs: str  # doc comment from chain metadata, via the receipt
    extrinsic_call: str  # e.g. "Balances.transfer_keep_alive" (best-effort)

    @property
    def key(self) -> str:
        """Knowledge-base lookup key, e.g. 'balances.InsufficientBalance'."""
        return f"{self.pallet.lower()}.{self.name}"


def decode_receipt(receipt: ExtrinsicReceipt) -> DecodedError | None:
    """Wrap a failed :class:`ExtrinsicReceipt` into a :class:`DecodedError`.

    Returns ``None`` if the extrinsic actually succeeded — there is nothing
    to debug in that case.
    """
    if receipt.is_success:
        return None

    # substrate-interface exposes the decoded error in the shape
    #   {'type': 'Balances', 'name': 'InsufficientBalance', 'docs': 'Balance too low'}
    # 'type' is the pallet name; there are no separate module/error indices.
    err = receipt.error_message or {}
    name = err.get("name") or "UnknownError"
    pallet = err.get("type") or "Unknown"

    docs_value = err.get("docs", "")
    docs = " ".join(docs_value) if isinstance(docs_value, list) else str(docs_value)

    extrinsic_call = ""
    call = getattr(receipt, "extrinsic", None)
    if call is not None:
        module = getattr(call, "call_module", None)
        function = getattr(call, "call_function", None)
        # call_module/call_function may be objects — coerce to their names.
        mod_name = getattr(module, "name", module)
        fn_name = getattr(function, "name", function)
        if mod_name and fn_name:
            extrinsic_call = f"{mod_name}.{fn_name}"

    return DecodedError(
        pallet=str(pallet),
        name=str(name),
        docs=docs,
        extrinsic_call=extrinsic_call,
    )


def find_receipt(
    substrate: SubstrateInterface,
    tx_hash: str,
    scan_blocks: int = RECENT_BLOCKS_SCAN,
) -> ExtrinsicReceipt | None:
    """Locate the :class:`ExtrinsicReceipt` for a bare tx hash.

    Substrate does not index tx hash -> block, so this walks back from the
    chain head up to ``scan_blocks`` blocks looking for a matching extrinsic.
    Fine for a local dev node; returns ``None`` if not found in range.
    """
    target = tx_hash.lower().removeprefix("0x")
    block_hash = substrate.get_chain_head()

    for _ in range(scan_blocks):
        block = substrate.get_block(block_hash=block_hash)
        for extrinsic in block["extrinsics"]:
            ext_hash = getattr(extrinsic, "extrinsic_hash", None)
            if ext_hash and ext_hash.hex().lower() == target:
                return ExtrinsicReceipt(
                    substrate=substrate,
                    extrinsic_hash=f"0x{target}",
                    block_hash=block_hash,
                )
        parent = block["header"]["parentHash"]
        if not parent or parent == block_hash:
            break
        block_hash = parent

    return None
