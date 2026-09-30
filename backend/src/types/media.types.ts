import { StorageProvider } from './storage.types';

// One row per uploaded file. The key is where the object sits in the bucket (or on disk) and the
// url is what a browser loads; both are stored so a bucket or domain change is a data migration
// rather than a code change.
export interface Media {
  id: number;
  key: string;
  url: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  mime: string;
  ext: string;
  size: number;
  width: number | null;
  height: number | null;
  provider: StorageProvider;
  createdAt: Date;
  updatedAt: Date;
}

// What a content row carries about its attached file: enough to render it, and the id the CMS
// needs to know which file is attached
export interface MediaRef {
  id: number;
  url: string;
  name: string;
  alternativeText: string | null;
  mime: string;
}

export interface NewMedia {
  key: string;
  url: string;
  name: string;
  alternativeText?: string | null | undefined;
  caption?: string | null | undefined;
  mime: string;
  ext: string;
  size: number;
  width?: number | null | undefined;
  height?: number | null | undefined;
  provider: StorageProvider;
}

export interface MediaUpdate {
  alternativeText?: string | null | undefined;
  caption?: string | null | undefined;
  name?: string | undefined;
}

export interface MediaFilters {
  search?: string | undefined;
  mimeGroup?: 'image' | 'document' | undefined;
}

export interface UploadedFile {
  originalName: string;
  buffer: Buffer;
  mime: string;
  size: number;
}

// What the CMS may send alongside an upload. Everything is optional: a file uploaded with no
// metadata takes its name from the original filename.
export interface UploadMeta {
  alternativeText?: string | null | undefined;
  caption?: string | null | undefined;
  name?: string | undefined;
}
