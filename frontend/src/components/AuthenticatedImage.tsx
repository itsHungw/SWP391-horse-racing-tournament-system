import { useState, useEffect, ImgHTMLAttributes } from "react";
import { httpClient } from "../api/httpClient";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

const PRIVATE_FILE_API_PREFIX = "/api/v1/files/private/";
const API_PREFIX = "/api/v1";

function getPrivateFilePath(url: string) {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    if (!parsedUrl.pathname.startsWith(PRIVATE_FILE_API_PREFIX)) {
      return null;
    }
    return `${parsedUrl.pathname.slice(API_PREFIX.length)}${parsedUrl.search}`;
  } catch {
    return null;
  }
}

export function AuthenticatedImage({ src, ...props }: Props) {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    const privatePath = getPrivateFilePath(src);
    if (!privatePath) {
      // It's not a private file, so we can use the source directly (assuming resolveFileUrl already wrapped it if needed)
      setResolvedSrc(src);
      return;
    }

    let isMounted = true;
    httpClient.get<{ url: string }>(privatePath)
      .then(res => {
        if (isMounted) {
          setResolvedSrc(res.data.url);
        }
      })
      .catch(() => {
        if (isMounted) setError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (error) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center text-slate-400 text-xs ${props.className || ''}`}>
        Failed to load image
      </div>
    );
  }

  if (!resolvedSrc) {
    return (
      <div className={`bg-slate-100 animate-pulse ${props.className || ''}`} />
    );
  }

  return <img {...props} src={resolvedSrc} />;
}
