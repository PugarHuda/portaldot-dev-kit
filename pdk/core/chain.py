"""Connection helpers and on-chain actions for talking to a Portaldot node."""

from __future__ import annotations

import re
import time
from decimal import Decimal, InvalidOperation

from substrateinterface import ExtrinsicReceipt, Keypair, SubstrateInterface
from substrateinterface.exceptions import SubstrateRequestException

_BARE_IDENTIFIER = re.compile(r"^[A-Za-z][A-Za-z0-9_]*$")
_GIT_BASH_MANGLED = re.compile(r"^[A-Za-z]:[\\/](?:Program Files[\\/])?Git[\\/](.+)$", re.IGNORECASE)


def normalise_account_uri(source: str) -> str:
    """Recover a derivation URI from common shell mangling.

    Git Bash / MSYS on Windows strips a leading slash from `//Alice`,
    turning it into `/Alice` before Python ever sees argv. Without this,
    a `//Bob` recipient becomes `/Bob` — a DIFFERENT, valid keypair — so
    `pdk send //Bob` would silently transfer real POT to the wrong
    address. Accepts `//Alice`, `/Alice`, or bare `Alice` and normalises
    all three to `//Alice`. Anything else (SS58 address, mnemonic) passes
    through unchanged.
    """
    s = source.strip()
    if s.startswith("//"):
        return s
    if s.startswith("/"):
        return f"/{s}"
    if _BARE_IDENTIFIER.match(s):
        return f"//{s}"
    return s


def detect_git_bash_mangling(source: str) -> str | None:
    """Recognise the heavier MSYS rewrite of a single-leading-slash arg
    (`/Alice` → `C:/Program Files/Git/Alice`) and return an actionable
    hint, or None if the input doesn't match that shape.
    """
    m = _GIT_BASH_MANGLED.match(source.strip())
    if not m:
        return None
    tail = m.group(1)
    return f'looks like git-bash rewrote a path — pass "//{tail}" or bare "{tail}" (or set MSYS_NO_PATHCONV=1)'

# A balance large enough that no dev account can ever hold it, so a transfer
# of this amount is guaranteed to fail in dispatch with InsufficientBalance.
_IMPOSSIBLE_AMOUNT = 10**30

# POT has 14 decimals (Portaldot chain spec). On a --dev chain these accounts
# are pre-funded with POT at genesis — the answer to "how do I get POT?".
POT_DECIMALS = 14
_DEV_ACCOUNTS = ("//Alice", "//Bob", "//Charlie")


def pot_to_plancks(amount: float | int | str) -> int:
    """Convert a human POT amount to integer plancks — EXACTLY.

    The naive `int(amount * 10**POT_DECIMALS)` loses precision: with 14
    decimals the product exceeds float64's ~15-16 significant digits, so
    e.g. 2.3 POT yields 229999999999999 plancks instead of
    230000000000000, and 0.7 POT loses a planck the same way. On a money
    path — `pdk send` submits a REAL on-chain transfer — the transferred
    amount must equal what the user typed. Route the amount through
    Decimal(str(...)) so the scaling is exact, then truncate any
    sub-planck remainder toward zero (a plancks is the indivisible unit).

    Accepts float/int/str. Raises ValueError on non-numeric or negative
    input so callers surface a clean error instead of a stack trace.
    """
    try:
        scaled = Decimal(str(amount)) * (10**POT_DECIMALS)
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"not a valid POT amount: {amount!r}") from exc
    if scaled < 0:
        raise ValueError("POT amount must be non-negative")
    return int(scaled)  # Decimal int() truncates toward zero — no float rounding


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
