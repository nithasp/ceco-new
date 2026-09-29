import { Locale } from '../types/common.types';
import {
  HeaderSlide,
  HeaderSlideUpdate,
  HeaderUpdate,
  NewHeader,
  NewHeaderSlide,
  SiteHeader,
} from '../types/header.types';
import { HeaderServiceDeps } from '../types/service.types';
import { AppError } from '../utils/errors';

const headerNotFound = (id: number) => new AppError(`header with id ${id} not found`, 404, 'not_found');
const slideNotFound = (id: number) => new AppError(`slide with id ${id} not found`, 404, 'not_found');

export function createHeaderService({ headers, files }: HeaderServiceDeps) {
  // An id that points at no file would leave a slide with a picture the site cannot load, so it is
  // rejected here rather than stored
  async function checkImage(imageId: number | null | undefined): Promise<void> {
    if (imageId === null || imageId === undefined) return;
    await files.requireMedia(imageId);
  }

  async function requireHeader(id: number): Promise<SiteHeader> {
    const header = await headers.show(id, true);
    if (!header) throw headerNotFound(id);
    return header;
  }

  return {
    // The site sees published slides only, so a draft can be prepared without appearing on the page
    getPublicHeader(locale: Locale): Promise<SiteHeader | null> {
      return headers.findByLocale(locale, false);
    },

    listHeaders(): Promise<SiteHeader[]> {
      return headers.index();
    },

    requireHeader,

    async createHeader(input: NewHeader): Promise<SiteHeader> {
      const existing = await headers.findByLocale(input.locale, true);
      if (existing) {
        throw new AppError(`A header already exists for locale "${input.locale}"`, 409, 'conflict');
      }
      return headers.create(input);
    },

    async updateHeader(id: number, changes: HeaderUpdate): Promise<SiteHeader> {
      const updated = await headers.update(id, changes);
      if (!updated) throw headerNotFound(id);
      return updated;
    },

    async deleteHeader(id: number): Promise<SiteHeader> {
      const existing = await requireHeader(id);
      const removed = await headers.delete(id);
      if (!removed) throw headerNotFound(id);
      return existing;
    },

    async addSlide(headerId: number, input: NewHeaderSlide): Promise<HeaderSlide> {
      await requireHeader(headerId);
      await checkImage(input.imageId);
      return headers.createSlide(headerId, input);
    },

    async updateSlide(id: number, changes: HeaderSlideUpdate): Promise<HeaderSlide> {
      await checkImage(changes.imageId);
      const updated = await headers.updateSlide(id, changes);
      if (!updated) throw slideNotFound(id);
      return updated;
    },

    async deleteSlide(id: number): Promise<HeaderSlide> {
      const existing = await headers.findSlide(id);
      if (!existing) throw slideNotFound(id);
      await headers.deleteSlide(id);
      return existing;
    },

    // The new order is applied inside the header the caller named, so an id from the other
    // language's carousel is left alone (OWASP API1)
    async reorderSlides(headerId: number, ids: number[]): Promise<HeaderSlide[]> {
      await requireHeader(headerId);
      await headers.setSlideOrder(headerId, ids);
      return headers.listSlides(headerId, true);
    },
  };
}

export type HeaderService = ReturnType<typeof createHeaderService>;
