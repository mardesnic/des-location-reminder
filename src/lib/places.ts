import * as Location from 'expo-location';

import { formatCoords, type LatLng } from '@/lib/geo';

export type PlaceResult = LatLng & { label: string; detail: string };

type NominatimResult = { lat: string; lon: string; name: string; display_name: string };

/**
 * Address / place search via OpenStreetMap Nominatim (free, max ~1 request/second,
 * so we only search when the user submits). Results are biased towards `near`.
 */
export async function searchPlaces(query: string, near: LatLng | null): Promise<PlaceResult[]> {
  const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '6' });
  if (near) {
    const d = 0.5; // ~50 km box, a preference not a hard limit
    params.set(
      'viewbox',
      [near.longitude - d, near.latitude + d, near.longitude + d, near.latitude - d].join(',')
    );
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'des-location-reminder/1.0 (github.com/mardesnic/des-location-reminder)' },
  });
  if (!response.ok) throw new Error(`Search failed (${response.status})`);

  const results = (await response.json()) as NominatimResult[];
  return results.map((r) => ({
    latitude: Number(r.lat),
    longitude: Number(r.lon),
    label: r.name || r.display_name.split(',')[0],
    detail: r.display_name,
  }));
}

/** A short human label for a point, using the phone's built-in reverse geocoder. */
export async function describePlace(point: LatLng): Promise<string> {
  try {
    const [address] = await Location.reverseGeocodeAsync(point);
    if (address) {
      const street = [address.street, address.streetNumber].filter(Boolean).join(' ');
      const parts = [address.name && address.name !== address.streetNumber ? address.name : street, address.city];
      const label = [...new Set(parts.filter(Boolean))].join(', ');
      if (label) return label;
    }
  } catch {
    // Offline or rate limited: fall back to coordinates.
  }
  return formatCoords(point);
}

export async function currentPosition(): Promise<LatLng | null> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return null;
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return position.coords;
}
