/**
 * "הפעל מיקום" for the property address: the phone's location → a street address in Hebrew.
 * Reverse geocoding uses OpenStreetMap's Nominatim (free, one request per tap – within its usage policy).
 */

export class LocationError extends Error {}

function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new LocationError('המכשיר לא תומך באיתור מיקום'));
      return;
    }
    // in the Android app a refused permission can leave the request unanswered – don't spin forever
    const guard = window.setTimeout(
      () => reject(new LocationError('אין גישה למיקום. אפשר להפעיל אותה בהגדרות הטלפון ← אפליקציות ← DirectScope ← הרשאות')),
      30000,
    );
    navigator.geolocation.getCurrentPosition((pos) => {
      window.clearTimeout(guard);
      resolve(pos);
    }, (err) => {
      window.clearTimeout(guard);
      if (err.code === err.PERMISSION_DENIED) reject(new LocationError('אין הרשאה למיקום. אפשר לאשר אותה בהגדרות הטלפון'));
      else if (err.code === err.TIMEOUT) reject(new LocationError('איתור המיקום לקח יותר מדי זמן, נסו שוב'));
      else reject(new LocationError('לא הצלחנו לאתר את המיקום. בדקו שהמיקום (GPS) פועל בטלפון'));
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  });
}

type NominatimAddress = Partial<
  Record<'road' | 'pedestrian' | 'house_number' | 'neighbourhood' | 'suburb' | 'city' | 'town' | 'village' | 'municipality', string>
>;

/** "הרצל 12, תל אביב" – street and number, then the city */
function formatAddress(a: NominatimAddress, fallback: string) {
  const street = [a.road ?? a.pedestrian, a.house_number].filter(Boolean).join(' ');
  const city = a.city ?? a.town ?? a.village ?? a.municipality;
  const parts = [street || a.neighbourhood || a.suburb, city].filter(Boolean);
  return parts.length ? parts.join(', ') : fallback;
}

export async function addressFromLocation(): Promise<string> {
  const { coords } = await currentPosition();
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=he&lat=${coords.latitude}&lon=${coords.longitude}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { address?: NominatimAddress; display_name?: string };
    const text = formatAddress(data.address ?? {}, data.display_name ?? '');
    if (!text) throw new Error('empty');
    return text;
  } catch {
    throw new LocationError('המיקום נמצא, אבל לא הצלחנו להפוך אותו לכתובת. בדקו את החיבור לאינטרנט');
  }
}
