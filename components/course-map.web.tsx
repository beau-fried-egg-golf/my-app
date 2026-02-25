import { useCallback, useEffect, useRef, useState } from 'react';
import Map, { Marker, MapRef } from 'react-map-gl/mapbox';
import { MAPBOX_ACCESS_TOKEN, STYLE_STREET, STYLE_SATELLITE, SATELLITE_ZOOM_THRESHOLD } from '@/constants/mapbox';
import { CourseMapProps, DEFAULT_CENTER, DEFAULT_ZOOM, USER_ZOOM } from './course-map-types';

function PinDot() {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#FE4D12',
        border: '2px solid #fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    />
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

  const [zoom, setZoom] = useState(initialZoom);

  const mapStyle = zoom >= SATELLITE_ZOOM_THRESHOLD ? STYLE_SATELLITE : STYLE_STREET;

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

  const handleMapClick = useCallback(() => {
    onCourseSelect(null);
  }, [onCourseSelect]);

  const handleCenterOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.lon, userLocation.lat],
        zoom: USER_ZOOM,
        duration: 1000,
      });
    }
  }, [userLocation]);

  const handleZoomIn = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      map.easeTo({ zoom: map.getZoom() + 1, duration: 300 });
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      map.easeTo({ zoom: map.getZoom() - 1, duration: 300 });
    }
  }, []);

  return (
    <div className="course-map-container" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 0 }}>
      <style>{`
        .course-map-container .mapboxgl-ctrl-bottom-right {
          top: 0;
          bottom: auto;
        }
      `}</style>
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: initialCenter.lat,
          longitude: initialCenter.lon,
          zoom: initialZoom,
        }}
        onZoom={(evt) => setZoom(evt.viewState.zoom)}
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
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onCourseSelect(course);
            }}
          >
            <div style={{ cursor: 'pointer' }}>
              <PinDot />
            </div>
          </Marker>
        ))}
      </Map>
      <div style={{ position: 'absolute', bottom: 80, right: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={handleZoomIn}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#fff',
            border: '1px solid #D0D0D0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 'bold',
            lineHeight: 1,
            padding: 0,
          }}
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#fff',
            border: '1px solid #D0D0D0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 'bold',
            lineHeight: 1,
            padding: 0,
          }}
          title="Zoom out"
        >
          -
        </button>
        {userLocation && (
          <button
            onClick={handleCenterOnUser}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#fff',
              border: '1px solid #D0D0D0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              lineHeight: 1,
              padding: 0,
            }}
            title="Center on my location"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
              <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
