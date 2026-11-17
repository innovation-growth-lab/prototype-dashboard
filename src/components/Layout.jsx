import {Suspense, useEffect, useState} from 'react';
import {Outlet, useLocation, useNavigationType} from 'react-router';
import {Container} from '@/components/ui/container';
import {FOOTER} from '../config.js';
import {flags} from '../flags.js';
import {getConsent} from '../lib/ga.js';
import CookieBanner from './CookieBanner.jsx';

// Wraps every page. No logo bar: the dashboard is one page with its own
// header. The footer is only there to reopen the cookie banner, so it shows
// only when analytics is on.
export default function Layout() {
  // null (closed), 'first' (they haven't answered) or 'reopened' (from the
  // footer). Read after hydration, as the prerendered HTML can't know.
  const [banner, setBanner] = useState(null);
  useEffect(() => {
    if (flags.analytics && getConsent() === null) setBanner('first');
  }, []);
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollManager />
      <main className="flex-1">
        {/* Holds a page whose code is still downloading (`load`). */}
        <Suspense>
          <Outlet />
        </Suspense>
      </main>
      {flags.analytics && (
        <Footer onCookieSettings={() => setBanner('reopened')} />
      )}
      {banner && (
        <CookieBanner
          reopened={banner === 'reopened'}
          onClose={() => setBanner(null)}
        />
      )}
    </div>
  );
}

// A link to /#about scrolls to that element; a new page starts at the top.
// Going back or forward is left to the browser, which restores the scroll
// position it remembers for that history entry.
function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (location.hash) {
      document
        .getElementById(decodeURIComponent(location.hash.slice(1)))
        ?.scrollIntoView();
    } else if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [location, navigationType]);
  return null;
}

// The legal line and a way to reopen the cookie banner.
function Footer({onCookieSettings}) {
  return (
    <footer className="border-t border-line print:hidden">
      <Container className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-6 text-sm text-grey-700">
        <p className="max-w-[68ch]">{FOOTER.legal}</p>
        <button
          type="button"
          onClick={onCookieSettings}
          className="font-semibold text-dark-blue hover:underline"
        >
          Cookie settings
        </button>
      </Container>
    </footer>
  );
}
