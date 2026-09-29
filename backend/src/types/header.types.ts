import { Locale } from './common.types';

// The home page hero carousel. One header per locale holds the slides in display order.
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
  createdAt: Date;
  updatedAt: Date;
}

export interface NewHeader {
  name: string;
  locale: Locale;
}

export interface HeaderUpdate {
  name?: string | undefined;
}

export interface NewHeaderSlide {
  title: string;
  description?: string | null | undefined;
  imageId?: number | null | undefined;
  position?: number | undefined;
  isPublished?: boolean | undefined;
}

export interface HeaderSlideUpdate {
  title?: string | undefined;
  description?: string | null | undefined;
  imageId?: number | null | undefined;
  position?: number | undefined;
  isPublished?: boolean | undefined;
}
