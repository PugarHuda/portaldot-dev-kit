"""Standalone repro for the update-demo recording: Python substrate-interface
cannot sign an Assets pallet call on Portaldot's V13 metadata. Kept as a
plain script (not a test) so the terminal recording shows one clean
command + its real failure, not a wall of inline Python.
"""
from substrateinterface import SubstrateInterface, Keypair

substrate = SubstrateInterface(url="ws://127.0.0.1:9944", type_registry_preset="substrate-node-template")
alice = Keypair.create_from_uri("//Alice")

call = substrate.compose_call(
    call_module="Assets",
    call_function="create",
    call_params={"id": 424243, "admin": alice.ss58_address, "min_balance": 1},
)
extrinsic = substrate.create_signed_extrinsic(call=call, keypair=alice)

try:
    substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)
    print("unexpected: the call succeeded")
except Exception as exc:  # noqa: BLE001 — this is a deliberate repro, not production code
    print(f"FAILED at the RPC layer, before reaching a dispatch error:\n  {exc}")
