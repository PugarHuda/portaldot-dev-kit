"""Dump the verified (pallet_index, error_index) -> "pallet.ErrorName" map from
the live Portaldot runtime metadata. Run against a running node; writes JSON to
stdout. The result is baked into pdk/data so FailLens can decode raw module
codes (e.g. Module: { index: 6, error: 2 }) offline.

Also writes a fingerprint sidecar `pdk/data/error_index.meta.json` next to the
main JSON, so the TypeScript loader (`pdk-ts/src/core/kb.ts:loadIndex`) can
warn users when the shipped index drifts from the runtime it was extracted
against. Keeping generation of both files in one script means the two never
disagree in practice.

Usage:
    python extract_index.py > pdk/data/error_index.json
    # the sidecar is written to pdk/data/error_index.meta.json automatically.
"""
import datetime
import json
import os
import sys

from substrateinterface import SubstrateInterface

NODE_URL = os.environ.get("PDK_EXTRACT_NODE", "ws://127.0.0.1:9944")
META_PATH = os.environ.get("PDK_INDEX_META_PATH", "pdk/data/error_index.meta.json")

sub = SubstrateInterface(url=NODE_URL, type_registry_preset="substrate-node-template")
sub.init_runtime()

def _resolve_runtime_fingerprint(sub_):
    """Robust to substrate-interface version drift.

    Older releases expose ``runtime_version`` as an int, newer ones as a
    dict-like ``RuntimeVersion`` object, some as an attribute on the
    runtime config. Try each shape, then fall back to a raw RPC.
    """
    spec_name = "portaldot"
    spec_version = 0

    rv_attr = getattr(sub_, "runtime_version", None)
    if isinstance(rv_attr, int):
        spec_version = rv_attr
    elif isinstance(rv_attr, dict):
        spec_name = str(rv_attr.get("specName", spec_name)).lower()
        try:
            spec_version = int(rv_attr.get("specVersion", 0))
        except (TypeError, ValueError):
            spec_version = 0

    if not spec_version:
        try:
            rv = sub_.rpc_request("state_getRuntimeVersion", []).get("result") or {}
            spec_name = str(rv.get("specName", spec_name)).lower()
            spec_version = int(rv.get("specVersion", 0))
        except Exception as e:  # noqa: BLE001 — extractor is a build tool, log + continue
            print(f"# runtime fingerprint fallback failed: {e}", file=sys.stderr)

    return spec_name, spec_version


spec_name, spec_version = _resolve_runtime_fingerprint(sub)

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
print(f"# pallets={len(sub.metadata.pallets)} codes={len(out)}", file=sys.stderr)
print(f"# 6.2 = {out.get('6.2')}", file=sys.stderr)

# Write the fingerprint sidecar. loadIndex() in pdk-ts cross-checks
# this against its compiled-in INDEX_SPEC_NAME / INDEX_SPEC_VERSION and
# warns on drift — so a regen for a new spec version bumps the sidecar
# atomically with the JSON.
meta = {
    "specName": spec_name,
    "specVersion": spec_version,
    "extractedAt": datetime.date.today().isoformat(),
    "source": f"extract_index.py against {NODE_URL}",
    "note": (
        "Fingerprint sidecar for error_index.json. Both files are regenerated "
        "together via extract_index.py; if you edit one, refresh the other. "
        "pdk-ts loadIndex() cross-checks specName/specVersion against "
        "INDEX_SPEC_NAME/INDEX_SPEC_VERSION constants and warns on drift."
    ),
}
os.makedirs(os.path.dirname(META_PATH) or ".", exist_ok=True)
with open(META_PATH, "w", encoding="utf-8") as fh:
    json.dump(meta, fh, indent=2)
    fh.write("\n")
print(f"# wrote sidecar: {META_PATH} ({spec_name}-{spec_version})", file=sys.stderr)
