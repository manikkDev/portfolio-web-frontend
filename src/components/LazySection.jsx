import { useEffect, useRef, useState } from 'react';

/**
 * LazySection — Only renders children when the section is near the viewport.
 * Uses IntersectionObserver with rootMargin to start loading before scroll.
 * Once loaded, stays loaded (no unloading) to prevent janky scroll behavior.
 */
const LazySection = ({ children, className = '', rootMargin = '200px', minHeight = '50vh', anchorId }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Once visible, stay loaded
        }
      },
      {
        rootMargin,
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      id={anchorId}
      ref={ref}
      className={className}
      style={
        !isVisible && minHeight && minHeight !== 'auto'
          ? { minHeight, contentVisibility: 'auto' }
          : undefined
      }
    >
      {isVisible ? children : null}
    </div>
  );
};

export default LazySection;
