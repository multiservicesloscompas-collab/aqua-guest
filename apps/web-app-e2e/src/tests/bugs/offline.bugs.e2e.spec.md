# Offline bugs (red on purpose)

Run: `npm run e2e:bugs -- --id B11,B12,B13,C1`. Full write-ups: `docs/audit/production-bugs.md`.

| ID  | User action                                                        | Expected                                   | Actual today                                       | Root cause                                                                                                           |
| :-- | :----------------------------------------------------------------- | :----------------------------------------- | :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| B11 | Register a sale with a tip offline, reconnect                      | A tip row pointing to the real sale        | The sale syncs, the tip never exists               | The offline branch of `completeSaleAction` never enqueues the tip                                                    |
| B12 | Register a rental for a NEW customer offline                       | The sheet closes, the rental is registered | «Error al registrar el alquiler», sheet stays open | `addRentalAction` inserts the customer in Supabase before checking connectivity                                      |
| B13 | Register a rental WITH a tip offline (existing customer)           | The sheet closes, the rental is registered | «Error al registrar el alquiler», sheet stays open | The store `addRental` upserts the tip online right after enqueuing the rental                                        |
| C1  | Same as a sale offline, with `offline.flag.global_orchestrator` on | Sale and its payments reach the database   | The sale arrives without payments                  | The global orchestrator resolves dependencies by action id, not by business key (latent: the flag is off by default) |

Controls (must pass now and after the fixes): C1 with the legacy processor (sale plus payments reach the database).
