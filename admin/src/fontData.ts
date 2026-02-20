// Binary font files imported as base64 via Vite's asset handling
import regularUrl from './fonts/GreyLLTT-Regular.ttf?url';
import mediumUrl from './fonts/GreyLLTT-Medium.ttf?url';
import boldUrl from './fonts/GreyLLTT-Bold.ttf?url';

// Convert font files to base64 data URIs at runtime for embedding
async function toDataUri(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:font/truetype;base64,${btoa(binary)}`;
}

let cached: { regular: string; medium: string; bold: string } | null = null;

export async function getFontDataUris() {
  if (cached) return cached;
  const [regular, medium, bold] = await Promise.all([
    toDataUri(regularUrl),
    toDataUri(mediumUrl),
    toDataUri(boldUrl),
  ]);
  cached = { regular, medium, bold };
  return cached;
}
