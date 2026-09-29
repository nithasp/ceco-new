export type Row = Record<string, unknown>;

export interface QueryOutcome<R extends Row = Row> {
  rows: R[];
  rowCount: number;
  // MySQL has no RETURNING clause, so a repository reads this back after an INSERT
  insertId: number;
}

// Every repository takes one of these and defaults to the pool, so the same method can run on its
// own or inside a transaction without a second copy of the query
export interface Queryable {
  query<R extends Row = Row>(text: string, values?: unknown[]): Promise<QueryOutcome<R>>;
}

export type Tx = Queryable;

export interface MysqlError {
  code?: string | undefined;
  errno?: number | undefined;
  sqlMessage?: string | undefined;
  sqlState?: string | undefined;
}
