import Svg, { Path, Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function BoldIcon({ size = 16, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M4 2.5H9.5C10.163 2.5 10.7989 2.76339 11.2678 3.23223C11.7366 3.70107 12 4.33696 12 5C12 5.66304 11.7366 6.29893 11.2678 6.76777C10.7989 7.23661 10.163 7.5 9.5 7.5H4V2.5Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 7.5H10.5C11.163 7.5 11.7989 7.76339 12.2678 8.23223C12.7366 8.70107 13 9.33696 13 10C13 10.663 12.7366 11.2989 12.2678 11.7678C11.7989 12.2366 11.163 12.5 10.5 12.5H4V7.5Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ItalicIcon({ size = 16, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Line x1={10} y1={2.5} x2={6} y2={13.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={6} y1={2.5} x2={11} y2={2.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={5} y1={13.5} x2={10} y2={13.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function LinkIcon({ size = 16, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6.5 8.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5l-1 1"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M9.5 7.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BulletListIcon({ size = 16, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx={3} cy={4} r={1.2} fill={color} />
      <Circle cx={3} cy={8} r={1.2} fill={color} />
      <Circle cx={3} cy={12} r={1.2} fill={color} />
      <Line x1={6.5} y1={4} x2={14} y2={4} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={6.5} y1={8} x2={14} y2={8} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={6.5} y1={12} x2={14} y2={12} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function NumberedListIcon({ size = 16, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <SvgText x={1} y={5.5} fill={color} fontSize={5.5} fontWeight="600">1</SvgText>
      <SvgText x={1} y={9.5} fill={color} fontSize={5.5} fontWeight="600">2</SvgText>
      <SvgText x={1} y={13.5} fill={color} fontSize={5.5} fontWeight="600">3</SvgText>
      <Line x1={6.5} y1={4} x2={14} y2={4} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={6.5} y1={8} x2={14} y2={8} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={6.5} y1={12} x2={14} y2={12} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function ImageIcon({ size = 16, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect
        x={1.5}
        y={2.5}
        width={13}
        height={11}
        rx={1.5}
        stroke={color}
        strokeWidth={1.3}
      />
      <Circle cx={5.5} cy={6.5} r={1.5} stroke={color} strokeWidth={1.2} />
      <Path
        d="M1.5 11L5 7.5L8 10.5L10.5 8L14.5 11.5"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
