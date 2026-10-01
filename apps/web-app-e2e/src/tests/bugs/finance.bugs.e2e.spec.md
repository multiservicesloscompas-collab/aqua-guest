# Finance consistency bugs (red on purpose)

Ported from the audit draft in commit `9a024e2` and re-verified against this branch: every test fails on its business assertion.
FIN-01 is bug B5 in `docs/audit/production-bugs.md` and is **fixed** (its spec now passes as a regression guard); the others are new findings listed as FIN-xx there.

| ID          | What the app does                                                                      | What it should do                                       |
| :---------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| FIN-01 (B5) | Dashboard income for a paid rental uses today's rate (Bs 250)                          | Keep the amount paid (Bs 182.50), like the method cards |
| FIN-02      | Transactions counts the incoming leg of an equilibrio as income (Bs 140)               | Income stays Bs 100                                     |
| FIN-04      | Equilibrio groups a rental by service date (Bs 240 today)                              | Use the payment date like the dashboard (Bs 0 today)    |
| FIN-06      | Transactions does not load the previous month when navigating to it (1 of 2 rows)      | Show both rows                                          |
| FIN-09      | Expense metrics add every expense in the store (Bs 50)                                 | Only the selected period (Bs 30)                        |
| FIN-10      | An expense of Bs 0 is saved                                                            | Reject it                                               |
| FIN-11      | A transfer larger than the balance is saved                                            | Block it                                                |
