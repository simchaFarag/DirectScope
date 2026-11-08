import { useCallback } from 'react';
import { useLocation, useNavigate as useRouterNavigate, type NavigateOptions, type To } from 'react-router-dom';

/** Where "back" goes when the screen was opened directly (a new tab, a bookmark, a link) and has no page before it. */
function parentOf(path: string) {
  if (/^\/setup\/(stage|expense)/.test(path)) return '/setup/budget';
  if (path.startsWith('/setup/inspiration/')) return '/setup/inspiration';
  if (path.startsWith('/setup/share/')) return '/setup/share';
  if (path.startsWith('/setup/')) return '/setup/details';
  if (path.startsWith('/app/share/')) return '/app/share';
  if (path.startsWith('/app/')) return '/app/home';
  return '/';
}

/**
 * react-router's navigate, except that nav(-1) on the first page of the tab goes to the screen's parent instead of
 * leaving the site (saving a form opened in a new tab used to end on about:blank or the previous website).
 */
export function useNavigate() {
  const nav = useRouterNavigate();
  const { pathname } = useLocation();
  return useCallback(
    (to: To | number, opts?: NavigateOptions) => {
      if (typeof to === 'number') {
        // BrowserRouter keeps the in-app history position in history.state.idx
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (to < 0 && idx + to < 0) return nav(parentOf(pathname), { replace: true });
        return nav(to);
      }
      return nav(to, opts);
    },
    [nav, pathname],
  );
}
