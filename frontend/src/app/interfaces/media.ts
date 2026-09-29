// An uploaded file, as the media library lists it
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
  provider: 'r2' | 'local';
  createdAt: string;
  updatedAt: string;
}
