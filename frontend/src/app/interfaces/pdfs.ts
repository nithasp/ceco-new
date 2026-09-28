export interface Pdfs {
  id: number;
  attributes: Attributes;
}

interface Attributes {
  Name: string;
  Description: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  Item: Item;
}

interface Item {
  data: Data;
}

interface Data {
  id: number;
  attributes: Attributes2;
}

interface Attributes2 {
  name: string;
  alternativeText: string;
  caption: string;
  width: any;
  height: any;
  formats: any;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: any;
  provider: string;
  provider_metadata: any;
  createdAt: string;
  updatedAt: string;
}
