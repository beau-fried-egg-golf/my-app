import { Platform } from 'react-native';
import { File as ExpoFile } from 'expo-file-system';
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
  const isGif = uri.toLowerCase().endsWith('.gif');
  const ext = isGif ? 'gif' : 'jpg';
  const contentType = isGif ? 'image/gif' : 'image/jpeg';
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  if (Platform.OS === 'web') {
    // Web: use blob approach with optional resize
    const response = await fetch(uri);
    const originalBlob = await response.blob();
    let blob: Blob;
    if (isGif || originalBlob.type === 'image/gif') {
      blob = originalBlob;
    } else {
      try {
        blob = await resizeImageOnWeb(uri);
      } catch {
        blob = originalBlob;
      }
    }
    if (blob.size === 0) throw new Error('Photo file is empty');
    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, blob, { contentType });
    if (error) throw error;
  } else {
    // Native: use expo-file-system File class which implements Blob (fetch().blob() returns 0 bytes on Hermes)
    const file = new ExpoFile(uri);
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength === 0) throw new Error('Photo file is empty');
    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, new Uint8Array(bytes), { contentType });
    if (error) throw error;
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Upload multiple photos and return their public URLs.
 */
export async function uploadPhotos(uris: string[], userId: string): Promise<string[]> {
  return Promise.all(uris.map((uri) => uploadPhoto(uri, userId)));
}
