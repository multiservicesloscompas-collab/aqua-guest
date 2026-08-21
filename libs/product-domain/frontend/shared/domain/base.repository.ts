import type { GetAllInput } from './query.types';

export interface BaseRepository<TEntity, TCreate, TUpdate, TId = string> {
  create(input: TCreate): Promise<TEntity>;
  getById(id: TId): Promise<TEntity | null>;
  getAll(input?: GetAllInput): Promise<TEntity[]>;
  update(id: TId, input: TUpdate): Promise<void>;
  delete(id: TId): Promise<void>;
}
