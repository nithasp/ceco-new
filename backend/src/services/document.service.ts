import { Locale } from '../types/common.types';
import {
  DocumentKind,
  NewSiteDocument,
  SiteDocument,
  SiteDocumentFilters,
  SiteDocumentUpdate,
} from '../types/document.types';
import { SiteDocumentServiceDeps } from '../types/service.types';
import { AppError } from '../utils/errors';

const notFound = (id: number) => new AppError(`document with id ${id} not found`, 404, 'not_found');

// The footer's download button looks for this one by name
export const COMPANY_PROFILE_NAME = 'Profile';

export function createSiteDocumentService({ documents, files }: SiteDocumentServiceDeps) {
  async function checkFile(fileId: number | null | undefined): Promise<void> {
    if (fileId === null || fileId === undefined) return;
    await files.requireMedia(fileId);
  }

  return {
    listPublic(kind: DocumentKind, locale?: Locale): Promise<SiteDocument[]> {
      return documents.index({ kind, ...(locale ? { locale } : {}), includeUnpublished: false });
    },

    listAll(filters: SiteDocumentFilters): Promise<SiteDocument[]> {
      return documents.index({ ...filters, includeUnpublished: true });
    },

    getCompanyProfile(): Promise<SiteDocument | null> {
      return documents.findByName('pdf', COMPANY_PROFILE_NAME);
    },

    getLogo(locale?: Locale): Promise<SiteDocument | null> {
      return documents.findFirst('logo', locale);
    },

    async getDocument(id: number): Promise<SiteDocument> {
      const document = await documents.show(id);
      if (!document) throw notFound(id);
      return document;
    },

    async createDocument(input: NewSiteDocument): Promise<SiteDocument> {
      await checkFile(input.fileId);
      return documents.create(input);
    },

    async updateDocument(id: number, changes: SiteDocumentUpdate): Promise<SiteDocument> {
      await checkFile(changes.fileId);
      const updated = await documents.update(id, changes);
      if (!updated) throw notFound(id);
      return updated;
    },

    async deleteDocument(id: number): Promise<SiteDocument> {
      const existing = await documents.show(id);
      if (!existing) throw notFound(id);
      await documents.delete(id);
      return existing;
    },
  };
}

export type SiteDocumentService = ReturnType<typeof createSiteDocumentService>;
