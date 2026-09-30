# Config bugs (red on purpose)

| ID  | User action                                                            | Expected                                      | Actual today            | Root cause                                                                                                                                             |
| :-- | :--------------------------------------------------------------------- | :-------------------------------------------- | :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| B8  | Open Precios, go offline, save a new deep-wash price, come back online | The product price reaches the database (2500) | The database keeps 1800 | `setProductPrice` in `useConfigStore.ts` returns early when offline and enqueues nothing (`products` is read-sync-only in the offline coverage matrix) |

Control: saving the same price online works and must stay green.
