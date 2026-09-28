export interface HeaderHomePage {
  id: number;
  attributes: Attributes;
}

interface Attributes {
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  Name: string;
  locale: string;
  Slides: HeaderHomePageSlide[];
}

export interface HeaderHomePageSlide {
  id: number;
  Title: string;
  Description: string;
  Image: Image;
}

interface Image {
  data: Data2[];
}

interface Data2 {
  id: number;
  attributes: ImageAttributes;
}

interface ImageAttributes {
  name: string;
  alternativeText: string;
  caption: string;
  width: number;
  height: number;
  formats: Formats;
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

interface Formats {
  thumbnail: Thumbnail;
  large: Large;
  medium: Medium;
  small: Small;
}

interface Thumbnail {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path: any;
  width: number;
  height: number;
  size: number;
  url: string;
}

interface Large {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path: any;
  width: number;
  height: number;
  size: number;
  url: string;
}

interface Medium {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path: any;
  width: number;
  height: number;
  size: number;
  url: string;
}

interface Small {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path: any;
  width: number;
  height: number;
  size: number;
  url: string;
}