export interface Experiences {
  id: number;
  attributes: Attributes;
}

interface Attributes {
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  type: string;
  locale: string;
  company: Company[];
}

interface Company {
  id: number;
  name: string;
  work: Work[];
}

interface Work {
  id: number;
  description: string;
  year: number;
}
