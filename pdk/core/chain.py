"""Connection helpers and on-chain actions for talking to a Portaldot node."""

from __future__ import annotations

import time

from substrateinterface import ExtrinsicReceipt, Keypair, SubstrateInterface
from substrateinterface.exceptions import SubstrateRequestException

# A balance large enough that no dev account can ever hold it, so a transfer
# of this amount is guaranteed to fail in dispatch with InsufficientBalance.
_IMPOSSIBLE_AMOUNT = 10**30

# POT has 14 decimals (Portaldot chain spec). On a --dev chain these accounts
# are pre-funded with POT at genesis — the answer to "how do I get POT?".
POT_DECIMALS = 14
_DEV_ACCOUNTS = ("//Alice", "//Bob", "//Charlie")


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


def submit_call(substrate, keypair, call_module, call_function, call_params, retries: int = 3):
    """Compose, sign, and submit a call; wait for inclusion; return the receipt.

    Retries with an increasing tip on a nonce/pool collision (error 1014) so
    rapid or repeated submissions stay reliable (used by demo, up, and seed).
    """
    call = substrate.compose_call(
        call_module=call_module, call_function=call_function, call_params=call_params
    )
    last_exc: SubstrateRequestException | None = None
    for attempt in range(retries):
        extrinsic = substrate.create_signed_extrinsic(call=call, keypair=keypair, tip=attempt * 1_000_000)
        try:
            return substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)
        except SubstrateRequestException as exc:
            if not _is_pool_collision(exc):
                raise
            last_exc = exc
            time.sleep(1)
    raise last_exc  # type: ignore[misc]


def trigger_demo_failure(substrate: SubstrateInterface, retries: int = 3) -> ExtrinsicReceipt:
    """Submit a transaction guaranteed to fail and return its receipt.

    Used by ``pdk debug --demo``. Alice transfers an impossible amount to Bob:
    the extrinsic is *included* (Alice pays the POT fee — satisfying the
    native-deployment gate) but *fails in dispatch* with InsufficientBalance,
    emitting the System.ExtrinsicFailed event FailLens decodes.
    """
    bob = Keypair.create_from_uri("//Bob")
    return submit_call(
        substrate, Keypair.create_from_uri("//Alice"), "Balances", "transfer_keep_alive",
        {"dest": bob.ss58_address, "value": _IMPOSSIBLE_AMOUNT}, retries,
    )


# The corrected counterpart to the demo failure: a small, valid amount.
_VALID_DEMO_AMOUNT = 1 * 10**POT_DECIMALS  # 1 POT — within any dev balance


def submit_valid_demo_transfer(substrate: SubstrateInterface, retries: int = 3) -> ExtrinsicReceipt:
    """Submit the *fixed* version of the demo failure: Alice sends Bob 1 POT,
    which succeeds. Powers ``pdk debug --demo --fix`` (diagnose → fix → success)."""
    bob = Keypair.create_from_uri("//Bob")
    return submit_call(
        substrate, Keypair.create_from_uri("//Alice"), "Balances", "transfer_keep_alive",
        {"dest": bob.ss58_address, "value": _VALID_DEMO_AMOUNT}, retries,
    )


def dev_account_balances(substrate: SubstrateInterface) -> list[tuple[str, str, float]]:
    """Return (name, ss58 address, POT balance) for the pre-funded dev accounts.

    Answers the question every Portaldot newcomer asks ("how do I get POT?"):
    on a --dev chain these accounts already hold POT at genesis — no faucet.
    """
    balances: list[tuple[str, str, float]] = []
    for uri in _DEV_ACCOUNTS:
        keypair = Keypair.create_from_uri(uri)
        account = substrate.query("System", "Account", [keypair.ss58_address])
        free = int(account.value["data"]["free"])
        balances.append((uri.lstrip("/"), keypair.ss58_address, free / 10**POT_DECIMALS))
    return balances


def free_balance(substrate: SubstrateInterface, address: str) -> float:
    """Return the free POT balance of an account."""
    account = substrate.query("System", "Account", [address])
    return int(account.value["data"]["free"]) / 10**POT_DECIMALS
