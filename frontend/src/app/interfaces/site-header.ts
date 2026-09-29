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
