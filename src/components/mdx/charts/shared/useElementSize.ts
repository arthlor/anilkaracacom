import { useEffect, useState, type RefObject } from "react";

/**
 * The element's rendered size, kept current with a ResizeObserver. Null until
 * measured (and during SSR), so callers can fall back to a design size.
 * Charts use it to lay out at real pixels instead of scaling a fixed viewBox,
 * which on a phone shrank 10px labels to about 4px.
 */
export function useElementSize(ref: RefObject<Element | null>) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const { width, height } = element.getBoundingClientRect();
      // Ignore collapsed states (hidden tabs, display: none parents).
      if (width < 1 || height < 1) return;
      setSize((current) =>
        current &&
        Math.round(current.width) === Math.round(width) &&
        Math.round(current.height) === Math.round(height)
          ? current
          : { width, height },
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
