export type Literal =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type WhereOperator =
  | ''
  | '='
  | '!='
  | 'NOT IN'
  | 'ILIKE'
  | 'IS NULL'
  | 'IS NOT NULL'
  | '<'
  | '>'
  | '<='
  | '>=';

export interface WhereField {
  field: string | string[];
  value: Literal | Literal[];
  operator?: WhereOperator;
  clearAlias?: boolean;
}

export interface GetAllInput {
  page?: number;
  limit?: number;
  relations?: string[];
  where?: {
    fields?: WhereField[];
  };
}
