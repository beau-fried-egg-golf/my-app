import { supabase } from './supabase';

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.6;

const AERIAL_MAX_DIMENSION = 2000;
const AERIAL_JPEG_QUALITY = 0.8;

function resizeImageWithOptions(file: File, maxDim: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Resize an image on web using canvas.
 */
function resizeImageOnWeb(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Upload an image file to Supabase Storage and return the public URL.
 * GIFs are uploaded as-is to preserve animation.
 */
export async function uploadImage(file: File): Promise<string> {
  const isGif = file.type === 'image/gif';
  const ext = isGif ? 'gif' : 'jpg';
  const contentType = isGif ? 'image/gif' : 'image/jpeg';
  const hash = Math.random().toString(36).slice(2, 8);
  const fileName = `admin/${Date.now()}-${hash}.${ext}`;

  let blob: Blob;
  if (isGif) {
    blob = file;
  } else {
    try {
      blob = await resizeImageOnWeb(file);
    } catch {
      blob = file;
    }
  }

  const { error } = await supabase.storage
    .from('photos')
    .upload(fileName, blob, { contentType });

  if (error) throw error;

  const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Upload an image to the hole-annotations bucket.
 * prefix = 'aerials' for aerial photos (2000px max, 0.8 quality)
 * prefix = 'pins' for pin photos (800px max, 0.6 quality)
 */
export async function uploadAnnotationImage(file: File, prefix: 'aerials' | 'pins' = 'aerials'): Promise<string> {
  const isGif = file.type === 'image/gif';
  const ext = isGif ? 'gif' : 'jpg';
  const contentType = isGif ? 'image/gif' : 'image/jpeg';
  const hash = Math.random().toString(36).slice(2, 8);
  const fileName = `${prefix}/${Date.now()}-${hash}.${ext}`;

  let blob: Blob;
  if (isGif) {
    blob = file;
  } else if (prefix === 'aerials') {
    try {
      blob = await resizeImageWithOptions(file, AERIAL_MAX_DIMENSION, AERIAL_JPEG_QUALITY);
    } catch {
      blob = file;
    }
  } else {
    try {
      blob = await resizeImageOnWeb(file);
    } catch {
      blob = file;
    }
  }

  const { error } = await supabase.storage
    .from('hole-annotations')
    .upload(fileName, blob, { contentType });

  if (error) throw error;

  const { data } = supabase.storage.from('hole-annotations').getPublicUrl(fileName);
  return data.publicUrl;
}
