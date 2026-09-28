import { Pagination } from './pagination';

export interface ApiResponse<T> {
  data: T[];
  meta: {
    pagination: Pagination;
  };
}