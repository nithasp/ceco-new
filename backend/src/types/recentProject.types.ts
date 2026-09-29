import { Locale } from './common.types';

// The "Recently Projects" slider on the home page
export interface RecentProject {
  id: number;
  name: string;
  description: string | null;
  locale: Locale;
  position: number;
  isPublished: boolean;
  imageId: number | null;
  imageUrl: string | null;
  imageAlt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewRecentProject {
  name: string;
  description?: string | null | undefined;
  locale: Locale;
  imageId?: number | null | undefined;
  position?: number | undefined;
  isPublished?: boolean | undefined;
}

export interface RecentProjectUpdate {
  name?: string | undefined;
  description?: string | null | undefined;
  locale?: Locale | undefined;
  imageId?: number | null | undefined;
  position?: number | undefined;
  isPublished?: boolean | undefined;
}

export interface RecentProjectFilters {
  locale?: Locale | undefined;
  includeUnpublished?: boolean | undefined;
}
