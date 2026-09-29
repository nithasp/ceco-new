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
