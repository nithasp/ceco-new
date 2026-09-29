import { Locale } from './locale';

export const DOCUMENT_KINDS = ['pdf', 'logo'] as const;

export type DocumentKind = typeof DOCUMENT_KINDS[number];

// The company profile PDF and the navbar logo. A null locale means it is used in every language.
export interface SiteDocument {
  id: number;
  kind: DocumentKind;
  name: string;
  description: string | null;
  locale: Locale | null;
  position: number;
  isPublished: boolean;
  fileId: number | null;
  fileUrl: string | null;
  fileName: string | null;
  fileMime: string | null;
  createdAt: string;
  updatedAt: string;
}
