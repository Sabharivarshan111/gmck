import * as React from 'react';

/** Tailwind's `lg`. The breakpoint the simulator's two layouts split on. */
const DESKTOP_BREAKPOINT = 1024;

/**
 * Which of two layouts is on screen, as a value React can branch on.
 *
 * `hidden lg:grid` and `lg:hidden` hide a subtree with CSS, and a subtree
 * hidden with CSS is still mounted. That is exactly right for a `<div>` and
 * exactly wrong for anything that holds a resource: the simulator rendered
 * both its desktop and its mobile layout on every device, so both
 * `AnatomicalBody3D` instances existed at once — two WebGL contexts, and the
 * whole 2,234-part atlas downloaded, decoded and merged into GPU buffers
 * twice, on the cheap phones this app is for.
 *
 * Read synchronously on the first render, so nothing mounts and immediately
 * unmounts. Crossing the breakpoint afterwards — a desktop window being
 * resized, and nothing else — swaps which layout is mounted, which is what the
 * CSS was describing all along.
 */
export function useIsDesktopLayout(): boolean {
  const [isDesktop, setIsDesktop] = React.useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const onChange = () => setIsDesktop(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}
