export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance between two points, in meters. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function formatCoords({ latitude, longitude }: LatLng): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
