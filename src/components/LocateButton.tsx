import { Loader2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { addressFromLocation, LocationError } from '@/lib/location';

/** "הפעל מיקום" under the property address field: fills the address from the phone's current location. */
export function LocateButton({ onAddress }: { onAddress: (address: string) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          onAddress(await addressFromLocation());
          toast('הכתובת מולאה לפי המיקום שלך – אפשר לתקן אותה');
        } catch (e) {
          toast(e instanceof LocationError ? e.message : 'לא הצלחנו לאתר את המיקום', 'info');
        } finally {
          setBusy(false);
        }
      }}
      className="mt-2 flex items-center gap-1.5 px-2 text-body text-primary-700 underline disabled:no-underline disabled:opacity-70"
    >
      {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <MapPin size={16} aria-hidden />}
      {busy ? 'מאתר מיקום…' : 'הפעל מיקום'}
    </button>
  );
}
