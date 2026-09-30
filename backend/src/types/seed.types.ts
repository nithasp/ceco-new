import { Locale } from './common.types';

// The shape the content seed reads its bundled hero slides and recent projects from: an image that
// ships with the frontend, plus the copy for it in both languages.
export interface SlideSeed {
  file: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}
