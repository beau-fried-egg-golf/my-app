import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Course } from '@/types';

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

  const markerIcon = useRef(
    L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
  ).current;

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
            icon={markerIcon}
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
