// Every endpoint answers with this envelope. `data` is the payload itself — an object or an array —
// rather than being wrapped a second time.
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  meta?: PageMeta;
}

export interface PageMeta {
  limit: number;
  offset: number;
  total: number;
}

export interface ApiError {
  status: number;
  message: string;
  data: null;
  code: string;
}

// A list call reshaped for the CMS: the rows, and the paging meta when the endpoint sent one
export interface Paged<T> {
  items: T[];
  meta?: PageMeta;
}
