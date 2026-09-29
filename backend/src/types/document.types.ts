import { Locale } from './common.types';

// The two site-wide files that are not page content: the company-profile PDF the footer links to,
// and the logo in the navbar. Both are a name plus an attached file, so one table covers them.
export const DOCUMENT_KINDS = ['pdf', 'logo'] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export interface SiteDocument {
  id: number;
  kind: DocumentKind;
  name: string;
  description: string | null;
  // null means the file is shown in every language
  locale: Locale | null;
  position: number;
  isPublished: boolean;
  fileId: number | null;
  fileUrl: string | null;
  fileName: string | null;
  fileMime: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewSiteDocument {
  kind: DocumentKind;
  name: string;
  description?: string | null | undefined;
  locale?: Locale | null | undefined;
  fileId?: number | null | undefined;
  position?: number | undefined;
  isPublished?: boolean | undefined;
}

export interface SiteDocumentUpdate {
  name?: string | undefined;
  description?: string | null | undefined;
  locale?: Locale | null | undefined;
  fileId?: number | null | undefined;
  position?: number | undefined;
  isPublished?: boolean | undefined;
}

export interface SiteDocumentFilters {
  kind?: DocumentKind | undefined;
  locale?: Locale | undefined;
  includeUnpublished?: boolean | undefined;
}
