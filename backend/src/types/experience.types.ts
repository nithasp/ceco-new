import { Locale } from './common.types';

// The four service pages each show a "previous work" table, matched by this type. The values are
// the ones the frontend already passes as typeData, so they must not be renamed lightly.
export const EXPERIENCE_TYPES = ['installation', 'design', 'commission', 'maintenance'] as const;

export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];

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
  createdAt: Date;
  updatedAt: Date;
}

export interface NewExperience {
  type: ExperienceType;
  locale: Locale;
  position?: number | undefined;
}

export interface ExperienceUpdate {
  type?: ExperienceType | undefined;
  position?: number | undefined;
}

export interface NewExperienceCompany {
  name: string;
  position?: number | undefined;
}

export interface ExperienceCompanyUpdate {
  name?: string | undefined;
  position?: number | undefined;
}

export interface NewExperienceWork {
  description: string;
  year?: number | null | undefined;
  position?: number | undefined;
}

export interface ExperienceWorkUpdate {
  description?: string | undefined;
  year?: number | null | undefined;
  position?: number | undefined;
}

export interface ExperienceFilters {
  locale?: Locale | undefined;
  type?: ExperienceType | undefined;
}
