import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN, STYLE_STREET, STYLE_SATELLITE, SATELLITE_ZOOM_THRESHOLD } from '@/constants/mapbox';
import { CourseMapProps, DEFAULT_CENTER, DEFAULT_ZOOM, USER_ZOOM } from './course-map-types';

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

  const handleCenterOnUser = useCallback(() => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.lon, userLocation.lat],
        zoomLevel: USER_ZOOM,
        animationDuration: 1000,
        animationMode: 'flyTo',
      });
    }
  }, [userLocation]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => {
      const next = Math.min(z + 1, 20);
      cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 300 });
      return next;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(z - 1, 0);
      cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 300 });
      return next;
    });
  }, []);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={styleURL}
        onPress={handleMapPress}
        onRegionDidChange={handleRegionChange}
        attributionPosition={{ bottom: 8, right: 8 }}
        logoPosition={{ bottom: 8, left: 8 }}
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
            <View style={styles.pin} />
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>
      <View style={styles.controlsColumn}>
        <Pressable style={styles.controlButton} onPress={handleZoomIn}>
          <Text style={styles.controlButtonText}>+</Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={handleZoomOut}>
          <Text style={styles.controlButtonText}>-</Text>
        </Pressable>
        {userLocation && (
          <Pressable style={styles.controlButton} onPress={handleCenterOnUser}>
            <MaterialIcons name="near-me" size={20} color="#000" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#FE4D12',
  },
  controlsColumn: {
    position: 'absolute',
    bottom: 100,
    right: 10,
    gap: 6,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonText: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    lineHeight: 24,
    color: '#000',
  },
});
