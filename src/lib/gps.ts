import { recordDriverLocation } from './services';

export function startDriverTracking(tripId: string, onError: (message: string) => void) {
  if (!('geolocation' in navigator)) {
    onError('This device does not provide browser location services.');
    return () => undefined;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => { void recordDriverLocation(tripId, position).catch((error: unknown) => {
      onError(error instanceof Error ? error.message : 'Unable to send GPS update.');
    }); },
    (error) => onError(error.message || 'Location permission was denied.'),
    { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
  );
  return () => navigator.geolocation.clearWatch(watchId);
}
