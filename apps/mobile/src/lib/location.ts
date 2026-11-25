import * as Location from 'expo-location';
import type { GeoPoint } from '@/api/types';

async function toPoint(latitude: number, longitude: number, fallbackAddress?: string): Promise<GeoPoint> {
  let place: Location.LocationGeocodedAddress | undefined;
  try {
    [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
  } catch {
    // Reverse geocoding can fail offline; coordinates are what matter.
  }
  const street = [place?.streetNumber, place?.street].filter(Boolean).join(' ');
  return {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: fallbackAddress || street || undefined,
    suburb: place?.district || place?.subregion || undefined,
    city: place?.city || undefined,
    province: place?.region || undefined,
  };
}

export async function currentPlace(): Promise<GeoPoint | 'denied'> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return 'denied';
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return toPoint(pos.coords.latitude, pos.coords.longitude);
}

export async function searchPlace(query: string): Promise<GeoPoint | null> {
  const results = await Location.geocodeAsync(`${query}, South Africa`);
  if (!results.length) return null;
  return toPoint(results[0].latitude, results[0].longitude, query);
}
