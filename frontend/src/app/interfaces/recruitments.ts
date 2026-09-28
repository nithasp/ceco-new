export interface Recruitments {
  id: number;
  attributes: Attributes;
}

interface Attributes {
  position: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  description: string;
  amount: number;
  priority?: number;
  locale: string;
}
