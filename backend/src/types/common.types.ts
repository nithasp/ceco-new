export type PartialUpdate<T> = { [K in keyof T]?: T[K] | undefined };

// Every piece of site copy exists once per language the site offers
export const LOCALES = ['th', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'th';
