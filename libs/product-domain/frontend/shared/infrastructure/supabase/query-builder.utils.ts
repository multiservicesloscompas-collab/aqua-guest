import type { GetAllInput, Literal, WhereField } from '../../domain';

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

const normalizeRelation = (relation: string): string => relation.trim();

const normalizeFieldName = (field: string): string => field.trim();

const isSafeFieldName = (field: string): boolean =>
  /^[a-zA-Z0-9_]+$/.test(field.trim());

const isComparableLiteral = (value: Literal): value is string | number | Date =>
  typeof value === 'string' || typeof value === 'number' || value instanceof Date;

export const buildSelectClause = (
  input: GetAllInput | undefined,
  baseSelect: string,
  relationSelects?: Record<string, string>
): string => {
  if (!input?.relations?.length || !relationSelects) {
    return baseSelect;
  }

  const relationClauses = input.relations
    .map(normalizeRelation)
    .filter((relation) => relation.length > 0)
    .map((relation) => relationSelects[relation])
    .filter(isDefined);

  if (relationClauses.length === 0) {
    return baseSelect;
  }

  return `${baseSelect}, ${relationClauses.join(', ')}`;
};

export const normalizeWhereOperator = (operator?: WhereField['operator']) =>
  operator && operator.length > 0 ? operator : '=';

export const formatNotInValue = (values: readonly Literal[]): string =>
  `(${values
    .map((value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }

      if (typeof value === 'string') {
        return value;
      }

      if (value === null) {
        return 'null';
      }

      if (value === undefined) {
        return 'undefined';
      }

      return String(value);
    })
    .join(',')})`;

export const normalizeLiteralValue = (value: Literal): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
};

export const resolvePaginationRange = (
  input?: GetAllInput
): { from: number; to: number } | null => {
  if (!input?.limit) {
    return null;
  }

  const limit = input.limit;
  const page = input.page && input.page > 0 ? input.page : 1;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { from, to };
};

export const validateWhereField = (whereField: WhereField): void => {
  const fields = Array.isArray(whereField.field)
    ? whereField.field
    : [whereField.field];

  for (const field of fields) {
    if (!isSafeFieldName(field)) {
      throw new Error(`Invalid where field: ${field}`);
    }
  }

  const operator = normalizeWhereOperator(whereField.operator);

  if (operator === 'ILIKE' && typeof whereField.value !== 'string') {
    throw new Error('ILIKE requires a string value');
  }

  if (operator === 'NOT IN' && !Array.isArray(whereField.value)) {
    throw new Error('NOT IN requires an array value');
  }

  if (
    ['<', '>', '<=', '>='].includes(operator) &&
    !isComparableLiteral(whereField.value as Literal)
  ) {
    throw new Error(`${operator} requires a comparable value`);
  }
};

export const resolveFieldNames = (field: string | string[]): string[] =>
  (Array.isArray(field) ? field : [field]).map(normalizeFieldName);
