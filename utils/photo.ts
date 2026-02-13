import { Platform } from 'react-native';
import { supabase } from '@/data/supabase';

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.6;

/**
 * Resize an image on web using canvas.
 */
function resizeImageOnWeb(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
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
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = uri;
  });
}

/**
 * Upload a photo to Supabase Storage and return the public URL.
 * GIFs are uploaded as-is to preserve animation.
 */
export async function uploadPhoto(uri: string, userId: string): Promise<string> {
  // Fetch the original blob to detect type
  const originalResponse = await fetch(uri);
  const originalBlob = await originalResponse.blob();
  const isGif = originalBlob.type === 'image/gif';

  const ext = isGif ? 'gif' : 'jpg';
  const contentType = isGif ? 'image/gif' : 'image/jpeg';
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  let blob: Blob;
  if (isGif) {
    blob = originalBlob;
  } else if (Platform.OS === 'web') {
    try {
      blob = await resizeImageOnWeb(uri);
    } catch {
      blob = originalBlob;
    }
  } else {
    blob = originalBlob;
  }

  const { error } = await supabase.storage
    .from('photos')
    .upload(fileName, blob, { contentType });

  if (error) throw error;

  const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Upload multiple photos and return their public URLs.
 */
export async function uploadPhotos(uris: string[], userId: string): Promise<string[]> {
  return Promise.all(uris.map((uri) => uploadPhoto(uri, userId)));
}
