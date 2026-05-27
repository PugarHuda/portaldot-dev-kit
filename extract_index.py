"""Dump the verified (pallet_index, error_index) -> "pallet.ErrorName" map from
the live Portaldot runtime metadata. Run against a running node; writes JSON to
stdout. The result is baked into pdk/data so FailLens can decode raw module
codes (e.g. Module: { index: 6, error: 2 }) offline."""
import json
from substrateinterface import SubstrateInterface

sub = SubstrateInterface(url="ws://127.0.0.1:9944", type_registry_preset="substrate-node-template")
sub.init_runtime()

out = {}
for pallet in sub.metadata.pallets:
    # pallet index in the runtime
    idx = getattr(pallet, "index", None)
    if idx is None:
        try:
            idx = pallet.value["index"]
        except Exception:
            continue
    errors = getattr(pallet, "errors", None) or []
    for ei, err in enumerate(errors):
        name = getattr(err, "name", None) or (err.value.get("name") if hasattr(err, "value") else None)
        if name:
            out[f"{int(idx)}.{ei}"] = f"{pallet.name}.{name}"

print(json.dumps(out, indent=0))
import sys
print(f"# pallets={len(sub.metadata.pallets)} codes={len(out)}", file=sys.stderr)
# sanity: 6.2 should be Balances.InsufficientBalance per the hero example
print(f"# 6.2 = {out.get('6.2')}", file=sys.stderr)
