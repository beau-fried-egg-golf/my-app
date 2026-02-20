import { Platform } from 'react-native';

export const Colors = {
  black: '#000000',
  white: '#FFFFFF',
  gray: '#888888',
  lightGray: '#E5E5E5',
  darkGray: '#333333',
  border: '#D0D0D0',
  orange: '#FE4D12',
  feYellow: '#FFEE54',
  // Desktop-specific tokens
  cream: '#F5F0E8',
  borderLight: '#E5E0D6',
  accentRed: '#FF4500',
};

const greyLLStack = "'Grey LL', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const Fonts = Platform.select({
  ios: {
    sans: 'GreyLL-Regular',
    sansMedium: 'GreyLL-Medium',
    sansBold: 'GreyLL-Bold',
    serif: 'ui-serif',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'GreyLL-Regular',
    sansMedium: 'GreyLL-Medium',
    sansBold: 'GreyLL-Bold',
    serif: 'serif',
    mono: 'monospace',
  },
  web: {
    sans: greyLLStack,
    sansMedium: greyLLStack,
    sansBold: greyLLStack,
    serif: "Georgia, 'Times New Roman', serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  bold: '700' as const,
};
