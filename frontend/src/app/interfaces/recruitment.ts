import { Locale } from './locale';

// An open job on the career page. `position` is the job title; `priority` orders the list.
export interface Recruitment {
  id: number;
  position: string;
  description: string | null;
  amount: number | null;
  priority: number;
  locale: Locale;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentPayload {
  position?: string;
  description?: string | null;
  amount?: number | null;
  priority?: number;
  locale?: Locale;
  isPublished?: boolean;
}

// The "new job" form before it is saved
export interface JobDraft {
  position: string;
  description: string;
  amount: number | null;
  isPublished: boolean;
}
