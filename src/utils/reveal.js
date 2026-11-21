import { useScroll, useSpring, useTransform } from 'framer-motion';

// Shared by the hero, About and Experience so every section enters the same way.

// A line of copy is wiped in from the left, as if a display were printing it. The clip
// reaches a little past the box so glows are not cut off, and is dropped once the line is in.
export const lineIn = {
  hidden: { opacity: 0, x: -16, clipPath: 'inset(-12% 100% -12% -4%)' },
  visible: {
    opacity: 1,
    x: 0,
    clipPath: 'inset(-12% -4% -12% -4%)',
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
    transitionEnd: { clipPath: 'none' }
  }
};

/** Opacity and offset tied to how far the element has scrolled into view, so it rides the scroll both ways. */
export function useScrollIn(ref, from = 48) {
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 97%', 'start 68%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.6 });
  return { opacity: progress, x: useTransform(progress, [0, 1], [from, 0]) };
}
