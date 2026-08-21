export interface SupabaseFilterBuilderLike<TResult> {
  select(columns: string): SupabaseFilterBuilderLike<TResult>;
  eq(column: string, value: unknown): SupabaseFilterBuilderLike<TResult>;
  neq(column: string, value: unknown): SupabaseFilterBuilderLike<TResult>;
  gt(column: string, value: unknown): SupabaseFilterBuilderLike<TResult>;
  gte(column: string, value: unknown): SupabaseFilterBuilderLike<TResult>;
  lt(column: string, value: unknown): SupabaseFilterBuilderLike<TResult>;
  lte(column: string, value: unknown): SupabaseFilterBuilderLike<TResult>;
  ilike(column: string, value: string): SupabaseFilterBuilderLike<TResult>;
  is(column: string, value: null | boolean): SupabaseFilterBuilderLike<TResult>;
  in(column: string, values: readonly unknown[]): SupabaseFilterBuilderLike<TResult>;
  not(
    column: string,
    operator: string,
    value: string
  ): SupabaseFilterBuilderLike<TResult>;
  order?(
    column: string,
    options?: { ascending?: boolean }
  ): SupabaseFilterBuilderLike<TResult>;
  range?(from: number, to: number): SupabaseFilterBuilderLike<TResult>;
  then: PromiseLike<TResult>['then'];
}

export interface SupabaseMutationBuilderLike<TResult> {
  select(columns: string): SupabaseMutationBuilderLike<TResult>;
  single?(): PromiseLike<TResult>;
  eq(column: string, value: unknown): SupabaseMutationBuilderLike<TResult>;
  then: PromiseLike<TResult>['then'];
}

export interface SupabaseTableLike<TResult> {
  select(columns: string): SupabaseFilterBuilderLike<TResult>;
  insert(value: unknown): SupabaseMutationBuilderLike<TResult>;
  upsert?(value: unknown, options?: { onConflict?: string }): SupabaseMutationBuilderLike<TResult>;
  update(value: Record<string, unknown>): SupabaseMutationBuilderLike<TResult>;
  delete(): SupabaseMutationBuilderLike<TResult>;
}

export interface SupabaseClientLike<TResult = { data: unknown; error: unknown }> {
  from(table: string): SupabaseTableLike<TResult>;
}
