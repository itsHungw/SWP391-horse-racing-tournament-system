import type { AnchorHTMLAttributes, MouseEvent } from "react";

import { httpClient } from "../api/httpClient";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

function isPrivateFileUrl(url: string) {
  return url.startsWith("/api/v1/files/private/");
}

function toHttpClientPath(url: string) {
  return url.slice("/api/v1".length);
}

export function AuthenticatedFileLink({ href, onClick, ...props }: Props) {
  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !isPrivateFileUrl(href)) {
      return;
    }

    event.preventDefault();
    const popup = window.open("about:blank", "_blank");
    if (popup) {
      popup.opener = null;
    }

    try {
      const response = await httpClient.get<{ url: string }>(toHttpClientPath(href));
      if (popup) {
        popup.location.href = response.data.url;
      } else {
        window.location.assign(response.data.url);
      }
    } catch {
      popup?.close();
      window.alert("Could not open this file. Please try again.");
    }
  };

  return <a {...props} href={href} onClick={handleClick} />;
}
