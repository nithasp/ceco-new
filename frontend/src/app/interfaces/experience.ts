import { Locale } from './locale';

// The values the service pages pass as typeData
export const EXPERIENCE_TYPES = ['installation', 'design', 'commission', 'maintenance'] as const;

export type ExperienceType = typeof EXPERIENCE_TYPES[number];

export interface ExperienceWork {
  id: number;
  description: string;
  year: number | null;
  position: number;
}

export interface ExperienceCompany {
  id: number;
  name: string;
  position: number;
  works: ExperienceWork[];
}

export interface Experience {
  id: number;
  type: ExperienceType;
  locale: Locale;
  position: number;
  companies: ExperienceCompany[];
  createdAt: string;
  updatedAt: string;
}

// The row being typed under a company in the CMS, before it is added
export interface WorkDraft {
  description: string;
  year: number | null;
}
