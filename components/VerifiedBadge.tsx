import { Ionicons } from '@expo/vector-icons';

export default function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <Ionicons
      name="checkmark-circle"
      size={size}
      color="#22C55E"
      style={{ marginLeft: 4 }}
    />
  );
}
