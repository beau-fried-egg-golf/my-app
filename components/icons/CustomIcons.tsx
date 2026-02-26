import Svg, { Path, Rect, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function ClubhouseIcon({ size = 24, color = '#1B1A1A', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Path
        d="M13 24L23 13L33 24"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 22V33H30V22"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CoursesIcon({ size = 24, color = '#1B1A1A', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Path
        d="M27 23.8744C30.5318 24.5688 33 26.1547 33 28C33 30.4853 28.5228 32.5 23 32.5C17.4772 32.5 13 30.4853 13 28C13 26.1547 15.4682 24.5688 19 23.8744M23 27.5V13.5L28.3177 16.7724C28.7056 17.0111 28.8995 17.1305 28.9614 17.2809C29.0154 17.412 29.0111 17.5599 28.9497 17.6877C28.8792 17.8343 28.6787 17.9422 28.2777 18.1581L23 21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FlagIcon({ size = 24, color = '#1B1A1A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Path
        d="M16.0103 25.6212C16.0103 25.6212 16.884 24.7475 19.5052 24.7475C22.1264 24.7475 23.8738 26.4949 26.495 26.4949C29.1162 26.4949 29.9899 25.6212 29.9899 25.6212V16.0102C29.9899 16.0102 29.1162 16.8839 26.495 16.8839C23.8738 16.8839 22.1264 15.1364 19.5052 15.1364C16.884 15.1364 16.0103 16.0102 16.0103 16.0102M16.0103 31.7373L16.0103 14.2627"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MembersIcon({ size = 24, color = '#1B1A1A', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Path
        d="M15 32.8174C15.6026 33 16.4165 33 17.8 33H28.2C29.5835 33 30.3974 33 31 32.8174M15 32.8174C14.8708 32.7783 14.7513 32.7308 14.638 32.673C14.0735 32.3854 13.6146 31.9265 13.327 31.362C13 30.7202 13 29.8802 13 28.2V17.8C13 16.1198 13 15.2798 13.327 14.638C13.6146 14.0735 14.0735 13.6146 14.638 13.327C15.2798 13 16.1198 13 17.8 13H28.2C29.8802 13 30.7202 13 31.362 13.327C31.9265 13.6146 32.3854 14.0735 32.673 14.638C33 15.2798 33 16.1198 33 17.8V28.2C33 29.8802 33 30.7202 32.673 31.362C32.3854 31.9265 31.9265 32.3854 31.362 32.673C31.2487 32.7308 31.1292 32.7783 31 32.8174M15 32.8174C15.0004 32.0081 15.0052 31.5799 15.0769 31.2196C15.3925 29.6329 16.6329 28.3925 18.2196 28.0769C18.606 28 19.0707 28 20 28H26C26.9293 28 27.394 28 27.7804 28.0769C29.3671 28.3925 30.6075 29.6329 30.9231 31.2196C30.9948 31.5799 30.9996 32.0081 31 32.8174M27 20.5C27 22.7091 25.2091 24.5 23 24.5C20.7909 24.5 19 22.7091 19 20.5C19 18.2909 20.7909 16.5 23 16.5C25.2091 16.5 27 18.2909 27 20.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MessagingIcon({ size = 24, color = '#1B1A1A', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Path
        d="M31.4885 23.0001C31.4885 27.6881 27.6881 31.4885 23.0001 31.4885C21.871 31.4885 20.7934 31.2681 19.808 30.8679C19.6194 30.7913 19.5251 30.753 19.4489 30.7359C19.3743 30.7192 19.3191 30.7131 19.2427 30.7131C19.1646 30.713 19.0795 30.7272 18.9093 30.7556L15.5537 31.3149C15.2023 31.3734 15.0266 31.4027 14.8995 31.3482C14.7883 31.3005 14.6997 31.2119 14.652 31.1007C14.5975 30.9737 14.6268 30.798 14.6854 30.4466L15.2447 27.0909C15.273 26.9207 15.2872 26.8357 15.2872 26.7575C15.2872 26.6811 15.2811 26.6259 15.2644 26.5514C15.2473 26.4751 15.209 26.3808 15.1324 26.1922C14.7322 25.2068 14.5117 24.1292 14.5117 23.0001C14.5117 18.3121 18.3121 14.5117 23.0001 14.5117C27.6881 14.5117 31.4885 18.3121 31.4885 23.0001Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function NotificationsIcon({ size = 24, color = '#1B1A1A', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Path
        d="M26.7978 29.1061C27.2266 30.7065 26.2768 32.3515 24.6764 32.7803C23.0761 33.2091 21.431 32.2594 21.0022 30.659M13.2087 22.7046C12.8192 21.3064 13.2242 19.7948 14.2606 18.7787M23.2982 16.8322C23.6024 16.2849 23.7026 15.6234 23.5277 14.9708C23.1704 13.6371 21.7995 12.8456 20.4659 13.203C19.1322 13.5603 18.3407 14.9312 18.6981 16.2649C18.873 16.9175 19.2905 17.4402 19.8276 17.7621M31.4709 17.8113C31.1091 16.4057 30.0025 15.2991 28.5969 14.9373M28.6425 20.5366C28.2855 19.2045 27.3326 18.0905 25.9933 17.4398C24.6541 16.789 23.0381 16.6548 21.5011 17.0667C19.964 17.4785 18.6317 18.4027 17.7972 19.6359C16.9627 20.8691 16.6944 22.3103 17.0514 23.6424C17.642 25.8465 17.5273 27.6048 17.1543 28.941C16.7293 30.4638 16.5167 31.2253 16.5741 31.3782C16.6398 31.5531 16.6874 31.6011 16.8616 31.6686C17.0139 31.7276 17.6536 31.5562 18.9332 31.2133L30.7983 28.0341C32.0778 27.6913 32.7176 27.5198 32.82 27.3926C32.9371 27.247 32.9542 27.1817 32.9237 26.9973C32.8969 26.8362 32.3322 26.2831 31.2026 25.1768C30.2116 24.2061 29.2331 22.7406 28.6425 20.5366Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MeetupsIcon({ size = 24, color = '#1B1A1A', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Path
        d="M19 13V16.5M27 13V16.5M14 21H32M16 15H30C31.1046 15 32 15.8954 32 17V31C32 32.1046 31.1046 33 30 33H16C14.8954 33 14 32.1046 14 31V17C14 15.8954 14.8954 15 16 15Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GroupsIcon({ size = 24, color = '#1B1A1A', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Path
        d="M23.5 19C23.5 21.2091 21.7091 23 19.5 23C17.2909 23 15.5 21.2091 15.5 19C15.5 16.7909 17.2909 15 19.5 15C21.7091 15 23.5 16.7909 23.5 19ZM13 33C13 29.6863 15.9101 26 19.5 26C23.0899 26 26 29.6863 26 33M30.5 16C30.5 17.6569 29.1569 19 27.5 19C25.8431 19 24.5 17.6569 24.5 16C24.5 14.3431 25.8431 13 27.5 13C29.1569 13 30.5 14.3431 30.5 16ZM24.5 26.5C25.4 26.2 26.4 26 27.5 26C30.2614 26 32.5 28.2386 32.5 31"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EditIcon({ size = 24, color = '#1B1A1A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Path
        d="M28 14L16 26L14 32L20 30L32 18L28 14ZM24 18L28 22"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SignOutIcon({ size = 24, color = '#1B1A1A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Path
        d="M13 14H22V19M22 27V32H13V14M26 23H34M34 23L30 19M34 23L30 27"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon({ size = 24, color = '#1B1A1A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Path
        d="M32 32L27.65 27.65M30 22C30 26.4183 26.4183 30 22 30C17.5817 30 14 26.4183 14 22C14 17.5817 17.5817 14 22 14C26.4183 14 30 17.5817 30 22Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ThumbtackIcon({ size = 24, color = '#1B1A1A', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 3.5H14.5V7L16.5 11.5C16.5 11.5 17 13 15 14.5H13V20.5M13 14.5H9C7 13 7.5 11.5 7.5 11.5L9.5 7V3.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GolfBagIcon({ size = 24, color = '#1B1A1A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Bag body */}
      <Path
        d="M8 11V20C8 20.5523 8.44772 21 9 21H15C15.5523 21 16 20.5523 16 20V11"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bag top rim */}
      <Path
        d="M7.5 11H16.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Bag pocket */}
      <Rect
        x={13}
        y={14}
        width={2.5}
        height={5}
        rx={0.5}
        stroke={color}
        strokeWidth={1.2}
      />
      {/* Club 1 - iron */}
      <Line x1={10} y1={3} x2={10} y2={11} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M9 3H11" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Club 2 - wood */}
      <Line x1={12.5} y1={4} x2={12.5} y2={11} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M11.5 4.5C11.5 3.67 12.17 3 13 3C13.5 3 13.8 3.3 13.8 3.7C13.8 4.3 13.2 4.8 12.5 4.8" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Club 3 - putter */}
      <Line x1={14.5} y1={5} x2={14.5} y2={11} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M14.5 5H16" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
