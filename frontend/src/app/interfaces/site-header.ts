import { Locale } from './locale';

// The home page hero carousel
export interface HeaderSlide {
  id: number;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  imageId: number | null;
  imageUrl: string | null;
  imageAlt: string | null;
}

export interface SiteHeader {
  id: number;
  name: string;
  locale: Locale;
  slides: HeaderSlide[];
  createdAt: string;
  updatedAt: string;
}

// What the CMS sends when it adds or edits a slide. Every field is optional because a PATCH only
// carries what changed.
export interface SlidePayload {
  title?: string;
  description?: string | null;
  imageId?: number | null;
  position?: number;
  isPublished?: boolean;
}

// The "new slide" form before it is saved. `previewUrl` is only for the thumbnail in the form and
// is never sent to the API.
export interface SlideDraft {
  title: string;
  description: string;
  imageId: number | null;
  previewUrl: string | null;
  isPublished: boolean;
}
