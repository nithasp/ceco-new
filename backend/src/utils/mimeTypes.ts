// An allow list, not a deny list: the extension written into the object key comes from here rather
// than from the uploaded filename, so an "image.php" cannot end up served as one (OWASP API8)
export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  'image/webp': '.webp',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
  'application/pdf': '.pdf',
};

export const isAllowedUpload = (mime: string): boolean => mime in ALLOWED_UPLOAD_TYPES;

export const extensionFor = (mime: string): string => ALLOWED_UPLOAD_TYPES[mime] ?? '';

export const isImage = (mime: string): boolean => mime.startsWith('image/');

// A raster image's real size can be read from the file; an SVG has no pixel size and a PDF is not
// an image at all
export const hasPixelSize = (mime: string): boolean => isImage(mime) && mime !== 'image/svg+xml';

export const describeAllowedTypes = (): string =>
  Object.keys(ALLOWED_UPLOAD_TYPES)
    .map((mime) => mime.replace(/^(image|application)\//, ''))
    .join(', ');
