import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Course } from '@/types';

function hasFEContent(course: Course): boolean {
  return !!(course.fe_hero_image || course.fe_profile_url || course.fe_profile_author || course.fe_egg_rating !== null || course.fe_bang_for_buck || course.fe_profile_date);
}

interface CourseMapProps {
  courses: Course[];
  userLocation: { lat: number; lon: number } | null;
  selectedCourse: Course | null;
  onCourseSelect: (course: Course | null) => void;
}

const DEFAULT_CENTER: [number, number] = [37.56, -122.15];
const DEFAULT_ZOOM = 9;
const USER_ZOOM = 10;

let lastMarkerClickTime = 0;

export default function CourseMap({
  courses,
  userLocation,
  selectedCourse,
  onCourseSelect,
}: CourseMapProps) {
  const [leaflet, setLeaflet] = useState<{ RL: any; L: any } | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const RL = require('react-leaflet');
      const L = require('leaflet');
      setLeaflet({ RL, L });
    }
  }, []);

  if (!leaflet) return null;

  const { RL, L } = leaflet;

  return (
    <CourseMapInner
      RL={RL}
      L={L}
      courses={courses}
      userLocation={userLocation}
      selectedCourse={selectedCourse}
      onCourseSelect={onCourseSelect}
    />
  );
}

// Stable inner component — only mounts once leaflet is loaded
function CourseMapInner({
  RL,
  L,
  courses,
  userLocation,
  selectedCourse,
  onCourseSelect,
}: CourseMapProps & { RL: any; L: any }) {
  const { MapContainer, TileLayer, Marker } = RL;

  function makePinIcon(color: string) {
    return L.divIcon({
      className: '',
      iconSize: [24, 36],
      iconAnchor: [12, 36],
      html: `<div style="width:24px;height:36px;position:relative;">
        <div style="width:24px;height:24px;background:${color};border:2px solid #000;border-radius:50% 50% 50% 0;transform:rotate(-45deg);position:absolute;top:0;left:0;"></div>
      </div>`,
    });
  }

  const feIcon = useRef(makePinIcon('#FFEE54')).current;
  const defaultIcon = useRef(makePinIcon('#FE4D12')).current;

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lon]
    : DEFAULT_CENTER;
  const zoom = userLocation ? USER_ZOOM : DEFAULT_ZOOM;

  const handleDismiss = useCallback(() => onCourseSelect(null), [onCourseSelect]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 0 }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView RL={RL} center={center} zoom={zoom} userLocation={userLocation} />
        {/* MapClickHandler disabled for debugging */}
        {courses.map((course) => (
          <Marker
            key={course.id}
            position={[course.latitude, course.longitude] as [number, number]}
            icon={hasFEContent(course) ? feIcon : defaultIcon}
            eventHandlers={{
              click: () => {
                lastMarkerClickTime = Date.now();
                onCourseSelect(course);
              },
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

function ChangeView({ RL, center, zoom, userLocation }: { RL: any; center: [number, number]; zoom: number; userLocation: any }) {
  const map = RL.useMap();
  const hasSetView = useRef(false);

  useEffect(() => {
    if (!hasSetView.current && userLocation) {
      map.setView(center, zoom);
      hasSetView.current = true;
    }
  }, [center, zoom, map, userLocation]);

  return null;
}

function MapClickHandler({ RL, onDismiss }: { RL: any; onDismiss: () => void }) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  RL.useMapEvents({
    click: () => {
      if (Date.now() - lastMarkerClickTime < 300) return;
      onDismissRef.current();
    },
  });
  return null;
}
