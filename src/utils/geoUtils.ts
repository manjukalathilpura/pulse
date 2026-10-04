/**
 * Utilities for Geolocation, distance calculation (Haversine), and geofence verification
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Calculates distance in meters between two lat/lng coordinates using the Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formats distance into human readable text (e.g. "45 m", "1.2 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Checks if coordinates are within geofence radius (default 200m)
 */
export function verifyGeofence(
  current: Coordinates,
  target: { latitude: number; longitude: number },
  radiusMeters: number = 200
): { isInside: boolean; distanceMeters: number } {
  const distanceMeters = calculateDistanceMeters(
    current.latitude,
    current.longitude,
    target.latitude,
    target.longitude
  );
  return {
    isInside: distanceMeters <= radiusMeters,
    distanceMeters,
  };
}

/**
 * Requests current device location from HTML5 Geolocation API with high accuracy
 */
export function getDeviceLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your device or browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        // Return clear, actionable error
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please allow GPS access in settings.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is currently unavailable.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Retrying with network signal.'));
            break;
          default:
            reject(new Error('Failed to obtain device GPS coordinates.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  });
}

/**
 * Formats coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lngStr}`;
}
