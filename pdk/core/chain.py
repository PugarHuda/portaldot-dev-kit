"""Connection helpers and on-chain actions for talking to a Portaldot node."""

from __future__ import annotations

import time

from substrateinterface import ExtrinsicReceipt, Keypair, SubstrateInterface
from substrateinterface.exceptions import SubstrateRequestException

# A balance large enough that no dev account can ever hold it, so a transfer
# of this amount is guaranteed to fail in dispatch with InsufficientBalance.
_IMPOSSIBLE_AMOUNT = 10**30


def connect(url: str) -> SubstrateInterface:
    """Open a connection to a Portaldot node.

    The Portaldot runtime (portaldot-1002) predates the MultiAddress type, so
    its extrinsics still use the legacy ``LookupSource`` type. substrate-interface
    needs the ``substrate-node-template`` type-registry preset to decode it —
    without the preset, composing a call fails with
    'Decoder class for "LookupSource" not found'.
    """
    return SubstrateInterface(url=url, type_registry_preset="substrate-node-template")


def _is_pool_collision(exc: SubstrateRequestException) -> bool:
    """True when the node rejected a tx that clashes with a pending one (nonce/priority)."""
    text = str(exc).lower()
    return "priority is too low" in text or "already in the pool" in text


def trigger_demo_failure(substrate: SubstrateInterface, retries: int = 3) -> ExtrinsicReceipt:
    """Submit a transaction guaranteed to fail and return its receipt.

    Used by ``pdk debug --demo`` so a demo always has a fresh failure to
    diagnose. Alice transfers an impossible amount to Bob: the extrinsic is
    *included* (Alice pays the POT transaction fee — satisfying the hackathon's
    native-deployment gate) but *fails in dispatch* with InsufficientBalance,
    emitting the System.ExtrinsicFailed event FailLens decodes.

    The demo transaction is identical every run, so two rapid invocations can
    collide on Alice's nonce ("Priority is too low ... already in the pool").
    Each retry adds a small tip, which raises the transaction's priority enough
    to replace the pending one — keeping ``pdk debug --demo`` reliable when a
    presenter runs it repeatedly on stage.
    """
    alice = Keypair.create_from_uri("//Alice")
    bob = Keypair.create_from_uri("//Bob")
    call = substrate.compose_call(
        call_module="Balances",
        call_function="transfer_keep_alive",
        call_params={"dest": bob.ss58_address, "value": _IMPOSSIBLE_AMOUNT},
    )

    last_exc: SubstrateRequestException | None = None
    for attempt in range(retries):
        extrinsic = substrate.create_signed_extrinsic(
            call=call, keypair=alice, tip=attempt * 1_000_000
        )
        try:
            return substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)
        except SubstrateRequestException as exc:
            if not _is_pool_collision(exc):
                raise
            last_exc = exc
            time.sleep(1)
    raise last_exc  # type: ignore[misc]
