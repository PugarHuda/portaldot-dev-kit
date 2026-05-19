"""Connection helpers and on-chain actions for talking to a Portaldot node.

NOTE: the chain-facing functions here are written against the documented
substrate-interface API but have NOT yet been run against a live Portaldot
node. Validate in task #3 / #6 once the Day-1 gate is passed.
"""

from __future__ import annotations

from substrateinterface import ExtrinsicReceipt, Keypair, SubstrateInterface

# A balance large enough that no dev account can ever hold it, so a transfer
# of this amount is guaranteed to fail in dispatch with InsufficientBalance.
_IMPOSSIBLE_AMOUNT = 10**30


def connect(url: str) -> SubstrateInterface:
    """Open a connection to a Portaldot node.

    Portaldot is Substrate-based, so substrate-interface speaks its protocol
    directly. If the official Python ``sdk_interface`` is preferred later, swap
    it in here behind this same signature so callers do not change.
    """
    return SubstrateInterface(url=url)


def trigger_demo_failure(substrate: SubstrateInterface) -> ExtrinsicReceipt:
    """Submit a transaction guaranteed to fail and return its receipt.

    Used by ``pdk debug --demo`` so a demo always has a fresh failure to
    diagnose. Alice transfers an impossible amount to Bob: the extrinsic is
    *included* (Alice pays the POT transaction fee — satisfying the hackathon's
    native-deployment gate) but *fails in dispatch* with InsufficientBalance,
    emitting the System.ExtrinsicFailed event FailLens decodes.
    """
    alice = Keypair.create_from_uri("//Alice")
    bob = Keypair.create_from_uri("//Bob")

    call = substrate.compose_call(
        call_module="Balances",
        call_function="transfer_keep_alive",
        call_params={"dest": bob.ss58_address, "value": _IMPOSSIBLE_AMOUNT},
    )
    extrinsic = substrate.create_signed_extrinsic(call=call, keypair=alice)
    return substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)
