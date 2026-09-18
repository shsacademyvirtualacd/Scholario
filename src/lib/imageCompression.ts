/**
 * Utility for client-side image compression and micro-thumbnail generation
 * before uploading to R2 storage.
 *
 * Compresses raw camera photos (often 3-10MB, 12-48MP) to crisp, web-optimized
 * images (~150-350KB, max 1600px dimension) at 80% quality.
 */

// In-memory cache for fast thumbnail and loaded image lookups
export const chatThumbnailCache = new Map<string, string>();
export const loadedImageUrls = new Set<string>();

export interface CompressionResult {
  file: File;
  thumbnailDataUrl?: string;
  isCompressed: boolean;
  originalSize: number;
  compressedSize: number;
}

/**
 * Checks if a file is an image that should be compressed.
 * Skips SVG and animated GIF files to preserve vectors and animations.
 */
export function isCompressibleImage(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  if (mime === 'image/gif' || mime === 'image/svg+xml') {
    return false;
  }
  if (mime.startsWith('image/')) {
    return true;
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'heic', 'heif'].includes(ext);
}

/**
 * Compresses an image file client-side:
 * - Resizes to max 1600px width/height while preserving aspect ratio
 * - Applies any specified rotation (e.g. from preview modal)
 * - Converts to optimized JPEG at 80% quality
 * - Produces a lightweight blurred base64 thumbnail (~500 bytes)
 */
export async function compressImageForUpload(
  file: File,
  rotation: number = 0,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<CompressionResult> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.80 } = options;

  if (!isCompressibleImage(file)) {
    return {
      file,
      isCompressed: false,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  return new Promise((resolve) => {
    const normRotation = ((rotation % 360) + 360) % 360;
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let origWidth = img.naturalWidth || img.width;
        let origHeight = img.naturalHeight || img.height;

        if (normRotation === 90 || normRotation === 270) {
          const temp = origWidth;
          origWidth = origHeight;
          origHeight = temp;
        }

        // Calculate scale factor to constrain to maxWidth x maxHeight
        let targetWidth = origWidth;
        let targetHeight = origHeight;

        if (targetWidth > maxWidth || targetHeight > maxHeight) {
          const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
          targetWidth = Math.round(targetWidth * ratio);
          targetHeight = Math.round(targetHeight * ratio);
        }

        // If file is already small (< 300KB) and within max dimensions and no rotation, keep original
        if (file.size <= 300 * 1024 && origWidth <= maxWidth && origHeight <= maxHeight && normRotation === 0) {
          const thumb = generateMicroThumbnail(img, normRotation);
          resolve({
            file,
            thumbnailDataUrl: thumb,
            isCompressed: false,
            originalSize: file.size,
            compressedSize: file.size,
          });
          return;
        }

        // Create main canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            file,
            isCompressed: false,
            originalSize: file.size,
            compressedSize: file.size,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Apply rotation if needed
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (normRotation !== 0) {
          ctx.rotate((normRotation * Math.PI) / 180);
        }

        const isSideways = normRotation === 90 || normRotation === 270;
        const drawW = isSideways ? targetHeight : targetWidth;
        const drawH = isSideways ? targetWidth : targetHeight;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Generate tiny placeholder thumbnail (32px width)
        const thumbnailDataUrl = generateMicroThumbnail(img, normRotation);

        // Convert canvas to Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({
                file,
                thumbnailDataUrl,
                isCompressed: false,
                originalSize: file.size,
                compressedSize: file.size,
              });
              return;
            }

            // Create clean filename with .jpg extension
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFilename = `${baseName}.jpg`;

            const FileConstructor = (window as any).File || File;
            const compressedFile = new FileConstructor([blob], compressedFilename, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }) as File;

            resolve({
              file: compressedFile,
              thumbnailDataUrl,
              isCompressed: true,
              originalSize: file.size,
              compressedSize: compressedFile.size,
            });
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        console.warn('[ImageCompression] Canvas error, falling back to original:', err);
        resolve({
          file,
          isCompressed: false,
          originalSize: file.size,
          compressedSize: file.size,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        file,
        isCompressed: false,
        originalSize: file.size,
        compressedSize: file.size,
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Generates an ultra-lightweight blurred data URL (~500 bytes)
 * to serve as an instant placeholder while the full image loads.
 */
function generateMicroThumbnail(img: HTMLImageElement, normRotation: number = 0): string | undefined {
  try {
    const thumbCanvas = document.createElement('canvas');
    const thumbWidth = 32;
    const aspect = (img.naturalHeight || img.height) / (img.naturalWidth || img.width);
    const isSideways = normRotation === 90 || normRotation === 270;
    const effectiveAspect = isSideways ? 1 / aspect : aspect;
    const thumbHeight = Math.max(16, Math.round(thumbWidth * effectiveAspect));

    thumbCanvas.width = thumbWidth;
    thumbCanvas.height = thumbHeight;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (!thumbCtx) return undefined;

    thumbCtx.imageSmoothingEnabled = true;
    thumbCtx.save();
    thumbCtx.translate(thumbWidth / 2, thumbHeight / 2);
    if (normRotation !== 0) {
      thumbCtx.rotate((normRotation * Math.PI) / 180);
    }
    const drawW = isSideways ? thumbHeight : thumbWidth;
    const drawH = isSideways ? thumbWidth : thumbHeight;
    thumbCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    thumbCtx.restore();

    return thumbCanvas.toDataURL('image/jpeg', 0.5);
  } catch {
    return undefined;
  }
}
