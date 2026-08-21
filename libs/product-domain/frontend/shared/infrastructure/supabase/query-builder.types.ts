import type { GetAllInput } from '../../domain';

export interface SupabaseGetAllConfig {
  table: string;
  select: string;
  relationSelects?: Record<string, string>;
  defaultOrderBy?: string;
  defaultAscending?: boolean;
}

export type ApplyGetAllQueryInput = {
  input?: GetAllInput;
  config: SupabaseGetAllConfig;
};
