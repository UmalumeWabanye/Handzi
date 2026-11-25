import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { fetchPrivateImage } from '../lib/api';
import { Spinner } from './ui';

/** Image from the API. Private uploads (ID, selfie, certificates) are fetched with the admin's token. */
export function SecureImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const isPrivate = !!src?.includes('/uploads/private/');
  const [url, setUrl] = useState<string | null>(isPrivate ? null : src ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src || !isPrivate) return;
    let revoked: string | null = null;
    let cancelled = false;
    fetchPrivateImage(src)
      .then((u) => {
        revoked = u;
        if (!cancelled) setUrl(u);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [src, isPrivate]);

  if (!src || failed)
    return (
      <div className={`flex items-center justify-center bg-hz-chalk text-hz-steel ${className}`}>
        <ImageOff className="h-6 w-6" />
      </div>
    );
  if (!url)
    return (
      <div className={`flex items-center justify-center bg-hz-chalk ${className}`}>
        <Spinner />
      </div>
    );
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img src={url} alt={alt} className={`bg-hz-chalk object-cover animate-fade-in ${className}`} />
    </a>
  );
}
