# Format bugs (red on purpose)

| ID  | User action                          | Expected                 | Actual today | Root cause                                                                                                       |
| :-- | :----------------------------------- | :----------------------- | :----------- | :--------------------------------------------------------------------------------------------------------------- |
| C12 | Open Transactions with a Bs 100 sale | Income shows «Bs 100,00» | «Bs 100»     | `TransactionsSummaryTotals.tsx` formats without options. **Decision pending**: confirm the intended format first |
