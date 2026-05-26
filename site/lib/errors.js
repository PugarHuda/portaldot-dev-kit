// Mirrors pdk/data/error_fixes.yaml — 29 entries, every key verified against the
// live portaldot-1002 runtime metadata. Shared by the dashboard FailLens widget
// and the /errors reference page.
export const ERRORS = [
  { p: "balances", n: "InsufficientBalance", s: "You tried to transfer more POT than the sending account holds.", f: ["Check the sender balance via the Portaldot explorer (portalscan.portaldot.io) or `pdk doctor`.", "Lower the transfer amount, or fund the account first (dev accounts are pre-funded on a --dev chain)."] },
  { p: "balances", n: "ExistentialDeposit", s: "The transfer would leave an account below the Existential Deposit, so it was rejected.", f: ["Leave at least the Existential Deposit in both the sender and receiver.", "Or move the whole balance with `transfer` (allow death) instead of `transfer_keep_alive`."] },
  { p: "balances", n: "KeepAlive", s: "The transfer would kill the sender account, but a keep-alive call was used.", f: ["Reduce the amount so the sender keeps at least the Existential Deposit.", "Use `transfer` if you intend to empty the account."] },
  { p: "balances", n: "LiquidityRestrictions", s: "The funds are locked or frozen (e.g. by staking or vesting) and cannot be moved.", f: ["Unlock the funds first — unbond from staking or wait for vesting to release."] },
  { p: "balances", n: "DeadAccount", s: "The target account does not exist on-chain (it was reaped below the Existential Deposit).", f: ["Send at least the Existential Deposit to create the account before further calls."] },
  { p: "balances", n: "VestingBalance", s: "The balance is still locked by a vesting schedule and cannot be spent yet.", f: ["Wait for the vesting schedule to release, or call `vesting.vest` to unlock vested funds."] },
  { p: "assets", n: "BalanceLow", s: "The account does not hold enough of this asset for the operation.", f: ["Mint or transfer more of the asset to the account before retrying."] },
  { p: "assets", n: "NoPermission", s: "The signer is not the issuer/admin/freezer of this asset.", f: ["Sign with the asset's admin account, or transfer the relevant role first."] },
  { p: "assets", n: "Unknown", s: "The referenced asset id does not exist.", f: ["Create the asset with `assets.create`, or correct the asset id."] },
  { p: "assets", n: "Frozen", s: "The asset or the account's holding of it is frozen.", f: ["Thaw the asset/account with the freezer role before transferring."] },
  { p: "assets", n: "WouldDie", s: "The operation would drop the account's asset balance below the minimum, killing it.", f: ["Leave at least the asset's minimum balance, or transfer the whole holding at once."] },
  { p: "assets", n: "Unapproved", s: "No approved allowance exists for this delegated transfer.", f: ["Call `assets.approve_transfer` from the owner before a `transfer_approved`."] },
  { p: "contracts", n: "ContractNotFound", s: "No contract exists at the supplied address.", f: ["Verify the address; ensure the contract was instantiated, not merely uploaded."] },
  { p: "contracts", n: "ContractTrapped", s: "The contract panicked or hit a trap during execution.", f: ["Check the contract logic and the message arguments; inspect debug output."] },
  { p: "contracts", n: "CodeNotFound", s: "No uploaded code matches the given code hash.", f: ["Upload the contract Wasm first, then instantiate with the resulting code hash."] },
  { p: "contracts", n: "CodeTooLarge", s: "The uploaded contract Wasm exceeds the runtime size limit.", f: ["Build with `--release` and optimise the Wasm (e.g. wasm-opt) to shrink it."] },
  { p: "contracts", n: "OutOfGas", s: "Execution ran out of the supplied gas (weight) budget.", f: ["Increase `gasLimit`. A dry-run call returns a realistic estimate to use."] },
  { p: "contracts", n: "StorageExhausted", s: "The contract has no storage budget left for this operation.", f: ["Fund the contract account so it can pay for additional storage."] },
  { p: "contracts", n: "MaxCallDepthReached", s: "Cross-contract calls nested deeper than the runtime call-depth limit.", f: ["Flatten the call graph so contracts do not call each other too deeply."] },
  { p: "identity", n: "NotFound", s: "No identity is registered for this account.", f: ["Register an identity with `identity.set_identity` before reading or judging it."] },
  { p: "identity", n: "TooManyRegistrars", s: "The registrar set is already at its maximum size.", f: ["No client-side fix — the runtime caps the number of registrars."] },
  { p: "multisig", n: "NotFound", s: "No matching multisig operation was found to approve or cancel.", f: ["Confirm the call hash, timepoint, and signatory set match the original proposal exactly."] },
  { p: "multisig", n: "NotOwner", s: "Only the account that opened the multisig call may cancel it.", f: ["Cancel from the original creator account, or approve instead of cancelling."] },
  { p: "proxy", n: "NotProxy", s: "The signer is not registered as a proxy for the target account.", f: ["Add the proxy relationship with `proxy.add_proxy` from the target account first."] },
  { p: "staking", n: "InsufficientBond", s: "The bonded amount is below the minimum required to stake.", f: ["Bond more POT so the stake meets the minimum bond threshold."] },
  { p: "staking", n: "NotController", s: "The signing account is not the controller for this stash.", f: ["Sign with the stash's controller account for staking operations."] },
  { p: "scheduler", n: "TargetBlockNumberInPast", s: "The scheduled call's target block is already in the past.", f: ["Schedule for a block number greater than the current chain head."] },
  { p: "dispatch", n: "BadOrigin", s: "The call requires a different origin (e.g. Root or a specific owner) than the signer used.", f: ["Sign with an account authorised for this call.", "Root-only calls must be routed through the `sudo` pallet on a dev node."] },
  { p: "dispatch", n: "CannotLookup", s: "An address lookup failed — e.g. an account index that does not resolve to an account.", f: ["Pass a full account address instead of an index, or check the index exists."] },
];

// Render `backtick` segments as <code> — returns an array of React-safe parts.
export function splitCode(text) {
  return text.split(/`([^`]+)`/).map((part, i) => ({ code: i % 2 === 1, text: part }));
}
