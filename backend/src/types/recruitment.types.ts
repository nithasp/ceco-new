import { Locale } from './common.types';

// An open job on the career page. `position` is the job title, kept under that name because the
// frontend already binds it; `priority` is what the list is ordered by.
export interface Recruitment {
  id: number;
  position: string;
  description: string | null;
  amount: number | null;
  priority: number;
  locale: Locale;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewRecruitment {
  position: string;
  description?: string | null | undefined;
  amount?: number | null | undefined;
  priority?: number | undefined;
  locale: Locale;
  isPublished?: boolean | undefined;
}

export interface RecruitmentUpdate {
  position?: string | undefined;
  description?: string | null | undefined;
  amount?: number | null | undefined;
  priority?: number | undefined;
  locale?: Locale | undefined;
  isPublished?: boolean | undefined;
}

export interface RecruitmentFilters {
  locale?: Locale | undefined;
  includeUnpublished?: boolean | undefined;
}
