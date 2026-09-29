export const STORAGE_PROVIDERS = ['r2', 'local'] as const;

export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];

export interface PutObject {
  key: string;
  body: Buffer;
  mime: string;
}

export interface StoredObject {
  key: string;
  url: string;
}

// Both drivers satisfy this, so the media service never learns where a file actually went
export interface StorageDriver {
  readonly provider: StorageProvider;
  put(object: PutObject): Promise<StoredObject>;
  remove(key: string): Promise<void>;
  urlFor(key: string): string;
}
