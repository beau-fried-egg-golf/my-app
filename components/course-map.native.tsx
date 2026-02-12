import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN, STYLE_STREET, STYLE_SATELLITE, SATELLITE_ZOOM_THRESHOLD } from '@/constants/mapbox';
import { CourseMapProps, DEFAULT_CENTER, DEFAULT_ZOOM, USER_ZOOM, hasFEContent } from './course-map-types';

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default function CourseMap({
  courses,
  userLocation,
  selectedCourse,
  onCourseSelect,
}: CourseMapProps) {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const hasCenteredOnUser = useRef(false);
  const [zoom, setZoom] = useState(userLocation ? USER_ZOOM : DEFAULT_ZOOM);

  const initialCenter = userLocation ?? DEFAULT_CENTER;
  const styleURL = zoom >= SATELLITE_ZOOM_THRESHOLD ? STYLE_SATELLITE : STYLE_STREET;

  // Fly to user location once available
  useEffect(() => {
    if (userLocation && !hasCenteredOnUser.current && cameraRef.current) {
      hasCenteredOnUser.current = true;
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.lon, userLocation.lat],
        zoomLevel: USER_ZOOM,
        animationDuration: 1500,
        animationMode: 'flyTo',
      });
    }
  }, [userLocation]);

  const handleRegionChange = useCallback((feature: GeoJSON.Feature) => {
    const props = feature.properties;
    if (props && typeof props.zoomLevel === 'number') {
      setZoom(props.zoomLevel);
    }
  }, []);

  const handleMapPress = useCallback(() => {
    onCourseSelect(null);
  }, [onCourseSelect]);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={styleURL}
        onPress={handleMapPress}
        onRegionDidChange={handleRegionChange}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [initialCenter.lon, initialCenter.lat],
            zoomLevel: userLocation ? USER_ZOOM : DEFAULT_ZOOM,
          }}
        />
        {courses.map((course) => (
          <MapboxGL.PointAnnotation
            key={course.id}
            id={course.id}
            coordinate={[course.longitude, course.latitude]}
            onSelected={() => onCourseSelect(course)}
          >
            <View
              style={[
                styles.pin,
                { backgroundColor: hasFEContent(course) ? '#FFEE54' : '#FE4D12' },
              ]}
            />
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
  },
});
