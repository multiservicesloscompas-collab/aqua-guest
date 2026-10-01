# Offline bugs (red on purpose)

Run: `npm run e2e:bugs -- --id C1`. Full write-ups: `docs/audit/production-bugs.md`.

| ID  | User action                                                        | Expected                                 | Actual today                      | Root cause                                                                                                           |
| :-- | :----------------------------------------------------------------- | :--------------------------------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| C1  | Same as a sale offline, with `offline.flag.global_orchestrator` on | Sale and its payments reach the database | The sale arrives without payments | The global orchestrator resolves dependencies by action id, not by business key (latent: the flag is off by default) |

Controls (must pass now and after the fixes): C1 with the legacy processor (sale plus payments reach the database).
