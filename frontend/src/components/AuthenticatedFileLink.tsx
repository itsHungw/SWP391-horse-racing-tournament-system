import type { AnchorHTMLAttributes, MouseEvent } from "react";

import { httpClient } from "../api/httpClient";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
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

export function AuthenticatedFileLink({ href, onClick, ...props }: Props) {
  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    const privateFilePath = getPrivateFilePath(href);
    if (event.defaultPrevented || !privateFilePath) {
      return;
    }

    event.preventDefault();
    const popup = window.open("about:blank", "_blank");
    if (popup) {
      popup.opener = null;
    }

    try {
      // Private files require the Authorization header from httpClient; direct tab navigation drops the JWT.
      const response = await httpClient.get<{ url: string }>(privateFilePath);
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
