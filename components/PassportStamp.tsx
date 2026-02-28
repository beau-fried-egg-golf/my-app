import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Circle as SvgCircle, Polygon, Path, G, Line } from 'react-native-svg';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

type StampShape = 'rectangle' | 'circle' | 'pentagon' | 'triangle';
const SHAPES: StampShape[] = ['rectangle', 'circle', 'pentagon', 'triangle'];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface PassportStampProps {
  courseId: string;
  courseName: string;
  state: string;
  datePlayed: string | null;
  onPress: () => void;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}.${dd}.${yyyy}`;
}

function CluckersIcon({ size }: { size: number }) {
  return (
    <Svg width={size * 0.55} height={size} viewBox="0 0 9 16">
      <G>
        <Path d="M1.812 14.227c-.2-.178-.441-.26-.538-.182-.097.077-.013.285.188.463.2.179.44.26.538.183.096-.078.012-.285-.188-.464Z" fill={Colors.black} />
        <Path d="M.538 12.972c.093-.004.135-.167.094-.365-.042-.197-.151-.354-.245-.351-.094.004-.135.167-.094.365.042.197.151.354.245.35Z" fill={Colors.black} />
        <Path d="M2.531 15.299c-.19-.101-.392-.12-.453-.041-.06.079.044.224.234.326.19.101.392.12.453.041.06-.079-.044-.224-.234-.326Z" fill={Colors.black} />
        <Path d="M.491 13.449c-.08.021-.085.169-.011.331.073.162.197.276.276.255.08-.021.085-.169.012-.331-.074-.162-.198-.276-.277-.255Z" fill={Colors.black} />
        <Path d="M3.82 15.21c-.258-.074-.511-.043-.564.069-.053.112.113.262.371.336.258.073.511.042.564-.07.053-.111-.113-.262-.371-.335Z" fill={Colors.black} />
        <Path d="M5.859 15.081c-.182.087-.31.23-.283.32.026.09.195.092.378.005.182-.087.31-.23.283-.32-.026-.09-.195-.092-.378-.005Z" fill={Colors.black} />
        <Path d="M4.936 15.665c-.202.005-.377.083-.39.175-.014.093.139.164.341.159.202-.005.377-.083.39-.175.014-.093-.139-.164-.341-.16Z" fill={Colors.black} />
        <Path d="M7.449 4.823c.373-.226.738-.7.818-.889-.271.032-.511.037-.733.013.35-.28.667-.824.723-1.006-.267.074-.5.114-.747.11.286-.314.466-.867.483-1.063-.276.158-.473.237-.712.281.228-.42.238-1.014.18-1.25-.205.218-.423.409-.663.565.06-.46-.094-1.067-.213-1.24-.093.247-.217.463-.355.658-.198-.418-.716-.885-.856-.998l.17 1.013c.204 1.8-.074 3.783-1.573 3.783-1.356.002-2.212-.99-2.146-2.547.039-.912.585-1.62 1.566-1.578-.35-.627-1.702-.77-2.369-.17C.53.926.094 1.861.01 3.825c-.215 5.063 2.894 5.663 3.96 5.663.801 0 1.465-.228 2.161-.69 1.352-.895 1.88-2.5 2.02-4.01-.226.038-.459.065-.702.035ZM.327 4.697c-.013.006-.028-.002-.042-.003a29 29 0 0 1 .004-.857c.073-1.721.443-2.718.917-3.136.176-.155.434-.258.721-.291.025.078.036.159.033.24a.2.2 0 0 1-.019.086.2.2 0 0 1-.079.064c-.146.07-.327.065-.47-.013-.073.163-.064.364.038.51.065.093.168.158.278.18a2.5 2.5 0 0 0-.161.763c-.014.327.364 1.73-1.219 2.458Z" fill={Colors.black} />
        <Path d="M6.137 9.125c-.713.442-1.388.64-2.169.64-.322 0-1.289-.057-2.222-.677-.532.332-.812.68-.812.68v.001a1.1 1.1 0 0 0-.042.357l.001.247a1.1 1.1 0 0 1-.16.49l-.126.199a.87.87 0 0 0 .064.824l.263.333a.75.75 0 0 1 .146.432l-.004.261c-.005.324.197.614.502.723l.262.064c.206.05.38.188.475.377l.112.222a.75.75 0 0 0 .847.438l.45-.067c.162-.024.327.028.447.14l.18.17a.68.68 0 0 0 1.101-.283l.183-.203c.146-.161.333-.23.573-.244.38-.023.633-.268.704-.451.144-.37.37-.421.525-.48.155-.058.208-.231.248-.381l.008-.03c.035-.131.143-.204.143-.204s.364-2.626-1.727-3.88Zm-4.964 2.713c-.148-.032-.256-.267-.241-.523.015-.257.148-.439.297-.406.149.032.257.266.242.523-.016.256-.149.438-.298.406Zm.901 1.597c-.148.063-.407-.109-.579-.382-.172-.274-.191-.546-.043-.608.148-.063.407.108.579.382.171.273.19.546.043.608Zm1.6.874a.2.2 0 0 1-.027.026.3.3 0 0 1-.204.054h-.001a.7.7 0 0 1-.154-.018 1 1 0 0 1-.094-.025 1.4 1.4 0 0 1-.214-.093 1.2 1.2 0 0 1-.1-.062l-.044-.033a1 1 0 0 1-.08-.068l-.001-.002a.5.5 0 0 1-.045-.05c-.064-.076-.099-.153-.095-.218a.2.2 0 0 1 .03-.08.2.2 0 0 1 .088-.06 .6.6 0 0 1 .548.085l.001.001c.018.009.036.018.054.027.177.098.302.224.347.336a.2.2 0 0 1 .01.033l.001.003a.2.2 0 0 1 .016.055.15.15 0 0 1-.034.109Zm1.814.275a.4.4 0 0 1-.234.21 1 1 0 0 1-.042.016 1 1 0 0 1-.047.014.9.9 0 0 1-.313.039h-.028-.004a.8.8 0 0 1-.155-.017 1 1 0 0 1-.047-.01 1 1 0 0 1-.04-.01.7.7 0 0 1-.259-.254c.007-.04.03-.077.065-.111.067-.063.178-.114.31-.142a1 1 0 0 1 .261-.026c.029 0 .057.001.084.004a.8.8 0 0 1 .438.199l.001.003.001.003c.006.02.008.041.004.063Zm.968-.373c-.233.137-.471.128-.529-.02-.059-.149.08-.381.314-.518.233-.138.47-.129.53.02.058.149-.081.38-.315.518Zm.654-1.241c.011-.01.023-.02.034-.03a.4.4 0 0 1 .172-.084.2.2 0 0 1 .032-.003h.002c.042.001.078.017.101.049a.2.2 0 0 1 .017.036.2.2 0 0 1 .007.042c.005.09-.05.209-.146.301a.3.3 0 0 1-.24.118c-.043 0-.078-.016-.101-.049a.2.2 0 0 1-.024-.078c-.005-.09.05-.208.146-.302Z" fill={Colors.black} />
      </G>
    </Svg>
  );
}

// FLW-inspired radial ticks inside the circle border
const circleTicks = (() => {
  const cx = 50, cy = 50;
  const ticks: { x1: number; y1: number; x2: number; y2: number; sw: number }[] = [];
  for (let i = 0; i < 24; i++) {
    const deg = i * 15;
    const angle = (deg - 90) * Math.PI / 180; // start from top
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const isCardinal = deg % 90 === 0;
    const isOrdinal = deg % 45 === 0 && !isCardinal;
    const rOuter = 44.5;
    const rInner = isCardinal ? 35 : isOrdinal ? 38 : 41;
    ticks.push({
      x1: cx + rInner * cos, y1: cy + rInner * sin,
      x2: cx + rOuter * cos, y2: cy + rOuter * sin,
      sw: isCardinal ? 1.5 : isOrdinal ? 1 : 0.7,
    });
  }
  return ticks;
})();

// Small diamonds at ordinal positions (45°, 135°, 225°, 315°) inside the circle
const circleDiamonds = (() => {
  const cx = 50, cy = 50, r = 36;
  const size = 2;
  return [45, 135, 225, 315].map(deg => {
    const angle = (deg - 90) * Math.PI / 180;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`;
  });
})();

// Precompute dots along a triangle midway between outer and inner borders
const triangleDots: { cx: number; cy: number }[] = (() => {
  // Mid-triangle vertices (between outer 50,5/95,92/5,92 and inner 50,14/89,88/11,88)
  const verts: [number, number][] = [[50, 10], [91, 89], [9, 89]];
  const dots: { cx: number; cy: number }[] = [];
  const perEdge = 6;
  for (let e = 0; e < 3; e++) {
    const [x1, y1] = verts[e];
    const [x2, y2] = verts[(e + 1) % 3];
    for (let i = 0; i < perEdge; i++) {
      const t = i / perEdge;
      dots.push({ cx: x1 + t * (x2 - x1), cy: y1 + t * (y2 - y1) });
    }
  }
  return dots;
})();

function ShapeSvg({ shape }: { shape: StampShape }) {
  const viewBox = shape === 'rectangle' ? '0 0 100 70' : '0 0 100 100';
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={viewBox}
      style={StyleSheet.absoluteFill}
    >
      {shape === 'rectangle' && (
        <>
          <Rect x="2" y="2" width="96" height="66" stroke={Colors.black} strokeWidth="2" fill="none" />
          <Rect x="6" y="6" width="88" height="58" stroke={Colors.black} strokeWidth="1.2" fill="none" />
        </>
      )}
      {shape === 'circle' && (
        <>
          <SvgCircle cx="50" cy="50" r="47" stroke={Colors.black} strokeWidth="2" fill="none" />
          {circleTicks.map((t, i) => (
            <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={Colors.black} strokeWidth={t.sw} />
          ))}
          {circleDiamonds.map((pts, i) => (
            <Polygon key={`d${i}`} points={pts} fill={Colors.black} />
          ))}
        </>
      )}
      {shape === 'pentagon' && (
        <>
          <Polygon points="50,3 94.7,35.5 77.6,88 22.4,88 5.3,35.5" stroke={Colors.black} strokeWidth="2" fill="none" />
          <Polygon points="50,9 89.9,38.0 74.5,84.5 25.5,84.5 10.1,38.0" stroke={Colors.black} strokeWidth="1.2" fill="none" />
        </>
      )}
      {shape === 'triangle' && (
        <>
          <Polygon points="50,5 95,92 5,92" stroke={Colors.black} strokeWidth="2" fill="none" />
          <Polygon points="50,14 89,88 11,88" stroke={Colors.black} strokeWidth="1.2" fill="none" />
          {/* Dots between the two triangle borders */}
          {triangleDots.map((d, i) => (
            <SvgCircle key={i} cx={d.cx} cy={d.cy} r="1.2" fill={Colors.black} />
          ))}
        </>
      )}
    </Svg>
  );
}

const SAFE_ZONES: Record<StampShape, { top: string; left: string; right: string; bottom: string }> = {
  rectangle: { top: '8%',  left: '8%',  right: '8%',  bottom: '8%' },
  circle:    { top: '12%', left: '10%', right: '10%', bottom: '12%' },
  pentagon:  { top: '20%', left: '14%', right: '14%', bottom: '12%' },
  triangle:  { top: '30%', left: '22%', right: '22%', bottom: '10%' },
};

export default function PassportStamp({ courseId, courseName, state, datePlayed, onPress, size }: PassportStampProps & { size?: number }) {
  const h = hashCode(courseId);
  const shapeIndex = h % 4;
  const shape = SHAPES[shapeIndex];
  const rotation = ((h % 1000) / 1000) * 8 - 4; // ±4 degrees
  const dateStr = formatDate(datePlayed);
  const zone = SAFE_ZONES[shape];

  return (
    <Pressable
      style={[styles.wrapper, size ? { width: size } : undefined, { transform: [{ rotate: `${rotation.toFixed(1)}deg` }] }]}
      onPress={onPress}
    >
      <View style={[styles.stampContainer, shape === 'rectangle' && { aspectRatio: 100 / 70 }]}>
        <ShapeSvg shape={shape} />

        {shape === 'rectangle' && (
          <View style={[styles.content, { top: zone.top, left: zone.left, right: zone.right, bottom: zone.bottom }]}>
            <Text style={styles.rectName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{courseName.toUpperCase()}</Text>
            <Text style={styles.smallText}>{state}</Text>
            {dateStr ? (
              <Text style={styles.rectDate}>{'\u2605'}  {dateStr}  {'\u2605'}</Text>
            ) : null}
            <View style={styles.brandRow}>
              <CluckersIcon size={18} />
              <Text style={styles.brandText}>Fried Egg Golf Club</Text>
            </View>
          </View>
        )}
        {shape === 'circle' && (
          <View style={[styles.content, { top: zone.top, left: zone.left, right: zone.right, bottom: zone.bottom }]}>
            <CluckersIcon size={20} />
            {dateStr ? <Text style={styles.smallText}>{dateStr}</Text> : null}
            <Text style={styles.circleName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{courseName}</Text>
            <Text style={styles.smallText}>{state}</Text>
          </View>
        )}
        {shape === 'pentagon' && (
          <View style={[styles.content, { top: zone.top, left: zone.left, right: zone.right, bottom: zone.bottom }]}>
            <Text style={styles.pentName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{courseName}</Text>
            <Text style={styles.smallText}>{state}</Text>
            {dateStr ? <Text style={styles.smallText}>{dateStr}</Text> : null}
            <Text style={styles.brandText}>Fried Egg Golf Club</Text>
            <CluckersIcon size={18} />
          </View>
        )}
        {shape === 'triangle' && (
          <View style={[styles.content, { top: zone.top, left: zone.left, right: zone.right, bottom: zone.bottom }]}>
            <CluckersIcon size={18} />
            {dateStr ? <Text style={styles.smallText}>{dateStr}</Text> : null}
            <Text style={styles.triName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{courseName}</Text>
            <Text style={styles.smallText}>{state}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '46%',
  },
  stampContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Rectangle
  rectName: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textAlign: 'center',
    lineHeight: 16,
  },
  rectDate: {
    fontSize: 10,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 1,
  },

  // Circle
  circleName: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textAlign: 'center',
    marginTop: 0,
    lineHeight: 16,
  },

  // Pentagon
  pentName: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Triangle
  triName: {
    fontSize: 13,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textAlign: 'center',
    marginTop: 0,
    lineHeight: 15,
  },

  // Shared
  smallText: {
    fontSize: 10,
    fontFamily: Fonts!.sans,
    color: Colors.black,
    marginTop: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    gap: 2,
  },
  brandText: {
    fontSize: 9,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 1,
  },
});
