# Prototype dashboard: notes for agents

One page listing IGL's prototypes by project, built on IGL's frontend
boilerplate (Vite, React Router, Tailwind in the IGL brand, prerendered to
static HTML). There is no backend: the content is `src/data/dashboard.json`
plus images in `public/thumbs/`. It's edited only under `npm run dev`, through
a dev-server middleware, and the live site
(innovationgrowthlab.org/tools/prototypes, deployed by `deploy.sh`) is
read-only. `README.md` covers set-up and editing for
people; this file is what you need to work on the code.

Many people working in these repos aren't frontend developers. Explain changes
in terms of what a visitor sees, show screenshots rather than code, and don't
ask them to review JSX.

## Commands

```sh
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serve dist/ locally
npm run lint       # Biome
```

With `npm run preview`, open pages with a trailing slash (`/components/`).
Without one, the preview server sends the home page's HTML and React reports a
hydration mismatch that isn't real; Apache redirects to the slash.

lefthook formats staged files with Biome on commit and lints on push. If a hook
fails, fix the code or add an ignore rule; don't skip the hooks with `--no-verify`.

## Rules the checks won't catch

- **Pages live in `src/routes.jsx`.** One line there gives a page its URL,
  prerenders it, and adds it to the screenshots. Never add a `<Route>` to
  `App.jsx` by hand: it would work in dev and 404 on the live site, which
  serves only prerendered files. A path with a parameter (`/guides/:slug`)
  needs `paths` listing every real URL, or `[]` for pages built from a
  visitor's own data (see Hosting).
- **An adapted IGL look.** This internal tool departs from the IGL brand on
  purpose, to match its mockup (`design/prototype-dashboard.reference.dc.html`):
  Mulish throughout with ExtraBold headings, rounded corners (`rounded-lg` on
  controls and cards, `rounded-xl` on dialogs, `rounded-md` on chips), round
  icon strokes, and a navy primary button rather than red.
- **Only the theme's colours exist.** Tailwind's own colours are switched off
  in `src/index.css`, so `bg-gray-100` or `text-slate-600` silently do
  nothing. Use the IGL names: `dark-blue`, `blue`, `blue-60`/`30`/`10`, `red`,
  `red-80`/`60`/`40`, `yellow` (`-80`/`60`/`30`), `green` (`-40`/`20`),
  `grey`, `grey-50`/`150`/`200`/`300`/`500`/`700`, `white`, `black`; the
  dashboard's neutrals: `ink-700` (body text), `ink-500` (muted text), `line`,
  `line-soft`, `surface`, `hover`, `navy-hover`, `danger`, `danger-tint`; and
  the link types' `type-*` inks and tints. shadcn's role names (`primary`,
  `muted-foreground`, `border`, `input`, `ring` …) also work. Yellow is for
  the Latest tag and the header's one small square, nothing else. The type
  scale is Tailwind's sizes (plus `text-2xs`); the mockup's 13, 15 and 22px
  sizes are written as `text-[15px]` and so on.
- **Pages render in Node first.** Prerendering runs every page with no
  browser, so anything that reads `window`, `document` or `localStorage` must
  be inside a `useEffect` or an event handler, never in the render itself.
  Content that depends on them renders after hydration.
- **Every page sets its title** with `<title>{pageTitle('Name')}</title>`
  (`src/config.js`). React needs `<title>` to hold one string.
- **Build from `src/components/ui/`** (see Components) before writing a
  control of your own. If one's missing, `npx shadcn add <name>` it and restyle
  it to IGL.
- **Never commit the Brown font files.** Brown is a commercial Lineto typeface
  and this repo is public; `.gitignore` excludes them. This tool doesn't use
  Brown (Mulish comes from `@fontsource-variable/mulish`).
- **Ask before anything that publishes.** `./deploy.sh` changes the live
  site and pushes a tag; `git push` changes what others see. Use the `deploy`
  skill.
- **Editing is dev-only.** Anything that edits goes behind
  `import.meta.env.DEV` (`EDITABLE` in `src/pages/Dashboard.jsx`), so the
  build leaves it out. The data's rules (ids, types, one latest per type per
  project, thumbnail paths) live in `src/lib/dashboard.js`, used by both the
  page and the save middleware: change them there, not in either caller.
- **Never hand-edit thumbnails into the JSON as base64.** They're files in
  `public/thumbs/<link-id>.<ext>`.
- **Say "project", never "section",** in anything a person reads.

## Where things are

- `src/data/dashboard.json`: the content. `public/thumbs/`: its thumbnails.
- `src/pages/Dashboard.jsx`: the page, its editor state, drag and drop.
- `src/components/dashboard/`: project sections and cards, the link and
  project dialogs, the move menu, the link types' icons and colours.
- `src/lib/dashboard.js`: the data's shape, validation and edits (pure JS).
- `src/lib/editor-api.js`, `scripts/dashboard-editor.js`: saving, page and
  dev-server sides (`POST /__save`, `POST /__thumb`).
- `src/routes.jsx`: every page, its URL, flag and prerendered paths.
- `src/pages/`: one file per page.
- `src/config.js`: site name, nav links, footer, `pageTitle()`.
- `src/components/ui/`: the UI components, shadcn/ui restyled to IGL, plus
  `Container` and `Eyebrow`. `/components` shows them all.
- `src/components/`: `Layout` (nav, footer, scroll handling, cookie banner),
  `CookieBanner`, `NotFound`.
- `src/flags.js`: feature flags.
- `src/lib/ga.js`: Google Analytics and cookie consent.
- `src/index.css`: the IGL brand as a Tailwind theme.
- `src/entry-server.jsx`, `scripts/prerender.js`: prerendering; rarely need
  changing.
- `scripts/screenshots.js`, `scripts/compare.js`: visual checks.
- `deploy.sh`, `deploy/.htaccess`: deploying to innovationgrowthlab.org.

## Feature flags

Each flag is `VITE_FLAG_<NAME>=on|off`, with its default in `src/flags.js` and
a line in `.env.example`. Set them in `.env.local` or for one command
(`VITE_FLAG_ANALYTICS=off npm run dev`). Any other value fails the build.

Vite fixes flag values at build time, so changing one means rebuilding.

**Off means hidden, not removed.** When a flag is off, what it covers can't be
seen or reached. Its code is still in the deployed files: the build keeps code
behind a flag and only skips running it, so anyone reading the site's
JavaScript can find that code and its text. A flag hides work in progress; it
doesn't keep anything secret.

- **A whole page:** give it `flag: '<name>'` and, in place of `element`,
  `load: () => import('./pages/X.jsx')` in `src/routes.jsx`. When the flag is
  off, the page isn't registered or prerendered, so its URL is the not-found
  page. Its code goes in a separate file that the site never requests: still
  on the server, but not downloaded by visitors. With the flag on, only
  visitors who open that page download it.
- **Part of a page:** `flags.<name> && ...`. That code stays in the main
  bundle, skipped when the flag is off.

`deploy.sh` forces flags for the live site in its `FLAGS` list, whatever the
`.env` files say, and writes them to `dist/VERSION`. Use that for anything
that must never be shown on the live site. The `add-flag` skill walks through
it.

## Components

`src/components/ui/` holds shadcn/ui components (`components.json`), on
**Base UI** rather than Radix, restyled to the IGL design system. `/components`
shows each one; it's behind the `componentsPage` flag, which `deploy.sh`
turns off for the live site.

- **Base UI, not Radix.** To make a trigger render as another component, use
  `render`, not `asChild`: `<DialogTrigger render={<Button variant="outline" />}>`.
  Base UI's docs (https://base-ui.com) cover each primitive.
- **Button.** `variant` is `default` (the navy primary, one per screen),
  `secondary`, `ghost`, `link`, `outline` or `destructive`; `size` is `sm`,
  `default`, `lg`, or `icon`/`icon-sm`/`icon-xs`/`icon-lg` for icon-only
  buttons (give those an `aria-label`). `to="/path"` makes it an in-app link
  and `href` an external one.
- **Icons** come from `lucide-react`, used directly, with their round ends.
  The dashboard puts a + before a button's label, as the mockup does:
  `<Button><Plus /> Add link</Button>`.
- **Labels:** `Label` is small and bold (`text-sm font-bold`).
- **Class names** are combined with `cn`, which lets a `className` override a
  component's own classes. `vite.config.js` points `import {cn} from 'cn'` at
  `src/lib/cn.js`, a copy taught the IGL theme's custom names
  (`tracking-label`, `max-w-page`, `shadow-menu`). Add a name there when you
  add a non-colour, non-size token to the theme.
- **Dark mode:** there isn't one. The components' `dark:` classes stay inert.
- **Lint:** `.biome.json` turns off three accessibility rules for
  `src/components/ui/` only, where shadcn's own patterns trip them. Elsewhere
  they apply.

A component added with `npx shadcn add <name>` arrives in shadcn's default
style and needs restyling to match the others:

- Form controls: `h-11`, `px-3`, `text-[15px]`, `rounded-lg`,
  `bg-background`, a `border-input` border.
- Focus: `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring`
  (a 2px blue edge). Invalid: `aria-invalid:border-destructive
  aria-invalid:ring-2 aria-invalid:ring-destructive`.
- Menu and list items: `rounded-md py-2 pl-3 text-[15px]`; their popup
  `rounded-lg`.
- No soft rings (`ring-ring/50`, `ring-foreground/10`: use `ring-border`).
- Then add it to `src/pages/Components.jsx`, and if it opens something, a
  screen to `STATES` in `scripts/screenshots.js`.

## Hosting

`npm run build` prerenders every path from `src/routes.jsx` to
`dist/<path>/index.html`, plus `dist/404.html` for unknown paths; the browser
then hydrates them. The dashboard's content is imported at build time, so the
prerendered page has every card in it.

The live site is on the IGL WordPress server (Apache) at
`https://www.innovationgrowthlab.org/tools/prototypes/`. `./deploy.sh` builds
for that path (`BASE`, passed to Vite as `VITE_BASE`), copies `dist/` to the
server over ssh (`igl-website` alias in `~/.ssh/config`), and tags the
release. It deploys only a clean, pushed, untagged commit. `--dry-run` builds
and lists what would change without deploying or keeping the tag; `--force`
skips the checks and the tag. Without a terminal it can't prompt for the tag,
so pass `--tag=v1.2.3`. `deploy/.htaccess` is copied in with `BASE` filled
in: it serves `404.html` for unknown paths (overriding WordPress's rewrites)
and stops pages being cached. The live version is at
`<site><BASE>VERSION`. Pushing to GitHub deploys nothing.

Because of the sub-path, anything that builds a URL to a file in `public/`
(thumbnails, say) prefixes it with `import.meta.env.BASE_URL`, as
`src/components/dashboard/Thumb.jsx` does; React Router's links already do.

There's no fallback to `index.html`: every valid URL must be a prerendered
file.

`VITE_VERSION` (tag and build time) is set by `deploy.sh` and readable as
`import.meta.env.VITE_VERSION`; dev builds leave it unset.

Cloudflare Workers behind Cloudflare Access is a possible later move (README,
Later); commit 8051455 has that set-up.

## Analytics and cookies

Off (`analytics` defaults to off in `src/flags.js`, and `deploy.sh` forces
it off): this is an internal page. The boilerplate's GA
and cookie banner code is still there (`src/lib/ga.js`, `CookieBanner`) should
that change; turning it on brings back the banner and the footer's Cookie
settings link.

## Checking visual changes

For anything visual, screenshot every screen before and after the change and
compare them side by side. This uses the installed Google Chrome, and needs the
dev server running.

```sh
npm run screenshots -- http://localhost:5173/ screens/before
# make the change
npm run screenshots -- http://localhost:5173/ screens/after
npm run compare -- screens/before screens/after screens/compare
```

Every path in `src/routes.jsx` is screenshotted automatically, named after its
URL. Add states a plain page load doesn't show (an open dialog, a filled form)
to `STATES` in `scripts/screenshots.js`; those are shot at window size, since a
full-page shot resizes the window and closes some popups. `ONLY=<regex>` limits
the run. Run the script with the same `VITE_FLAG_*` values as the dev server,
since it reads the page list itself. Look at the compare images, and show the
person the relevant ones.

## Skills

`.claude/skills/` has step-by-step recipes for the common requests: `add-page`,
`add-flag` and `deploy` (`deploy.sh`).
