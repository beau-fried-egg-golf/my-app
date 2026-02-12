import { useCallback, useEffect, useRef, useState } from 'react';
import Map, { Marker, MapRef, ViewStateChangeEvent } from 'react-map-gl/mapbox';
import { MAPBOX_ACCESS_TOKEN, STYLE_STREET, STYLE_SATELLITE, SATELLITE_ZOOM_THRESHOLD } from '@/constants/mapbox';
import { CourseMapProps, DEFAULT_CENTER, DEFAULT_ZOOM, USER_ZOOM, hasFEContent } from './course-map-types';

function PinSvg({ color }: { color: string }) {
  return (
    <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"
        fill={color}
        stroke="#000"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function CourseMap({
  courses,
  userLocation,
  selectedCourse,
  onCourseSelect,
}: CourseMapProps) {
  const mapRef = useRef<MapRef>(null);
  const hasCenteredOnUser = useRef(false);

  const initialCenter = userLocation ?? DEFAULT_CENTER;
  const initialZoom = userLocation ? USER_ZOOM : DEFAULT_ZOOM;

  const [viewState, setViewState] = useState({
    latitude: initialCenter.lat,
    longitude: initialCenter.lon,
    zoom: initialZoom,
  });

  const mapStyle = viewState.zoom >= SATELLITE_ZOOM_THRESHOLD ? STYLE_SATELLITE : STYLE_STREET;

  // Fly to user location once when it becomes available
  useEffect(() => {
    if (userLocation && !hasCenteredOnUser.current && mapRef.current) {
      hasCenteredOnUser.current = true;
      mapRef.current.flyTo({
        center: [userLocation.lon, userLocation.lat],
        zoom: USER_ZOOM,
        duration: 1500,
      });
    }
  }, [userLocation]);

  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState);
  }, []);

  const handleMapClick = useCallback(() => {
    onCourseSelect(null);
  }, [onCourseSelect]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 0 }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onClick={handleMapClick}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {courses.map((course) => (
          <Marker
            key={course.id}
            latitude={course.latitude}
            longitude={course.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onCourseSelect(course);
            }}
          >
            <div style={{ cursor: 'pointer' }}>
              <PinSvg color={hasFEContent(course) ? '#FFEE54' : '#FE4D12'} />
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
