// The counts the admin overview shows, so an editor can see what is on the site at a glance.
// Content is stored once per language, so the two-language items are counted separately.
export interface Tally {
  slidesTh: number;
  slidesEn: number;
  projectsTh: number;
  projectsEn: number;
  jobsTh: number;
  jobsEn: number;
  workTables: number;
  files: number;
  hasLogo: boolean;
  hasProfilePdf: boolean;
}
