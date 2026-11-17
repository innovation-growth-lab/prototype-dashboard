// Site-wide settings and copy that isn't part of a page. Most of a new
// project's set-up happens here, plus <title> in index.html.

// The tool's name: page titles and the not-found page.
export const SITE_NAME = 'Prototype dashboard';

// The footer, which shows only when analytics is on (src/components/Layout.jsx).
export const FOOTER = {
  legal:
    'Innovation Growth Lab is a global initiative led by Nesta, a registered charity in England and Wales (1144091) and Scotland (SC042833).',
};

export const COOKIE_POLICY_URL =
  'https://www.innovationgrowthlab.org/cookie-policy';

// A page's <title>: pageTitle('Results') is "Results | <SITE_NAME>", and
// pageTitle() is the home page's. React wants <title> to hold one string.
export const pageTitle = (page) =>
  page ? `${page} | ${SITE_NAME}` : `${SITE_NAME} | Innovation Growth Lab`;
