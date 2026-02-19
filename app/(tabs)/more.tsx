import { Redirect } from 'expo-router';

// The "More" tab opens a modal overlay instead of navigating here.
// If a user lands on this route (e.g. web deep-link), redirect home.
export default function MoreScreen() {
  return <Redirect href="/" />;
}
