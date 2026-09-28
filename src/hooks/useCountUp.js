import { useEffect, useRef, useState } from "react";

// Counts up to `target` once the element is on screen. If `target` changes
// later (e.g. listings finish loading after the strip is already visible),
// it animates from the current number to the new one instead of staying stuck.
export function useCountUp(target, duration = 1400) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const visible = useRef(false);
  const current = useRef(0);
  const frame = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const set = (n) => {
      current.current = n;
      setVal(n);
    };
    const animate = () => {
      cancelAnimationFrame(frame.current);
      const from = current.current;
      if (from === target) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return set(target);
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        set(Math.round(from + (target - from) * eased));
        if (p < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    };

    if (visible.current || typeof IntersectionObserver === "undefined") {
      visible.current = true;
      animate();
      return () => cancelAnimationFrame(frame.current);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          visible.current = true;
          io.disconnect();
          animate();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return [val, ref];
}
