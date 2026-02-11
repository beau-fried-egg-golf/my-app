import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link
          rel="preload"
          href="/fonts/Ionicons.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GreyLLTT-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GreyLLTT-Medium.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GreyLLTT-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <ScrollViewStyleReset />
        <style id="expo-generated-fonts" dangerouslySetInnerHTML={{ __html: `
          @font-face {
            font-family: 'ionicons';
            src: url('/fonts/Ionicons.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
          @font-face {
            font-family: 'Grey LL';
            src: url('/fonts/GreyLLTT-Regular.ttf') format('truetype');
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }
          @font-face {
            font-family: 'Grey LL';
            src: url('/fonts/GreyLLTT-Medium.ttf') format('truetype');
            font-weight: 500;
            font-style: normal;
            font-display: swap;
          }
          @font-face {
            font-family: 'Grey LL';
            src: url('/fonts/GreyLLTT-Bold.ttf') format('truetype');
            font-weight: 700;
            font-style: normal;
            font-display: swap;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
