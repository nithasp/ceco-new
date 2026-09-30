import { Locale } from './locale';

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
  createdAt: string;
  updatedAt: string;
}

export interface RecentProjectPayload {
  name?: string;
  description?: string | null;
  locale?: Locale;
  imageId?: number | null;
  position?: number;
  isPublished?: boolean;
}

// The "new project" form before it is saved; `previewUrl` is for the form thumbnail only
export interface ProjectDraft {
  name: string;
  description: string;
  imageId: number | null;
  previewUrl: string | null;
  isPublished: boolean;
}
