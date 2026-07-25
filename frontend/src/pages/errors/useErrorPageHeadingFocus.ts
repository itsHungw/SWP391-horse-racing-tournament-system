import { useLayoutEffect, useRef } from "react";

export function useErrorPageHeadingFocus() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return headingRef;
}
