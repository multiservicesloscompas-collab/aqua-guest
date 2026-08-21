import type { GetAllInput, WhereField } from '../../domain';
import type { ApplyGetAllQueryInput } from './query-builder.types';
import type {
  SupabaseFilterBuilderLike,
  SupabaseTableLike,
} from './supabase-like.types';
import {
  buildSelectClause,
  formatNotInValue,
  normalizeLiteralValue,
  normalizeWhereOperator,
  resolveFieldNames,
  resolvePaginationRange,
  validateWhereField,
} from './query-builder.utils';

const applySingleWhereField = <TResult>(
  query: SupabaseFilterBuilderLike<TResult>,
  whereField: WhereField
): SupabaseFilterBuilderLike<TResult> => {
  validateWhereField(whereField);

  const operator = normalizeWhereOperator(whereField.operator);
  const fields = resolveFieldNames(whereField.field);

  if (fields.length > 1) {
    throw new Error(
      'Multiple fields in a single where condition are not yet supported by the Supabase adapter'
    );
  }

  const [field] = fields;
  const value = whereField.value;

  if (operator === 'IS NULL') {
    return query.is(field, null);
  }

  if (operator === 'IS NOT NULL') {
    return query.not(field, 'is', 'null');
  }

  if (operator === 'ILIKE') {
    return query.ilike(field, `%${String(value)}%`);
  }

  if (Array.isArray(value)) {
    if (operator === '=') {
      return query.in(field, value.map(normalizeLiteralValue));
    }

    if (operator === '!=' || operator === 'NOT IN') {
      return query.not(field, 'in', formatNotInValue(value));
    }
  }

  const normalizedValue = normalizeLiteralValue(value as Exclude<typeof value, readonly unknown[]>);

  if (operator === '=') {
    return query.eq(field, normalizedValue);
  }

  if (operator === '!=') {
    return query.neq(field, normalizedValue);
  }

  if (operator === '>') {
    return query.gt(field, normalizedValue);
  }

  if (operator === '>=') {
    return query.gte(field, normalizedValue);
  }

  if (operator === '<') {
    return query.lt(field, normalizedValue);
  }

  if (operator === '<=') {
    return query.lte(field, normalizedValue);
  }

  throw new Error(`Unsupported where operator: ${operator}`);
};

const applyWhereFields = <TResult>(
  query: SupabaseFilterBuilderLike<TResult>,
  input?: GetAllInput
): SupabaseFilterBuilderLike<TResult> => {
  const whereFields = input?.where?.fields ?? [];

  return whereFields.reduce(
    (currentQuery, whereField) => applySingleWhereField(currentQuery, whereField),
    query
  );
};

export const applyGetAllQuery = <TResult>(
  table: SupabaseTableLike<TResult>,
  { config, input }: ApplyGetAllQueryInput
): SupabaseFilterBuilderLike<TResult> => {
  let query = table.select(
    buildSelectClause(input, config.select, config.relationSelects)
  );

  query = applyWhereFields(query, input);

  if (config.defaultOrderBy && query.order) {
    query = query.order(config.defaultOrderBy, {
      ascending: config.defaultAscending ?? true,
    });
  }

  const range = resolvePaginationRange(input);
  if (range && query.range) {
    query = query.range(range.from, range.to);
  }

  return query;
};
