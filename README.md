# Prototype dashboard

One page listing IGL's prototypes by project: live prototypes, dated
snapshots, Figma designs and prototypes, Miro boards and other links, each as
a card that opens in a new tab. Built on IGL's frontend boilerplate (Vite,
React Router, Tailwind), styled after IGL's brand but rounder and with
Mulish throughout (see `design/` for the mockup), prerendered to static HTML, hosted
on Cloudflare Workers behind Cloudflare Access.

There is no backend. The content is one file, `src/data/dashboard.json`, and
the thumbnails are images in `public/thumbs/`. The live site is read-only.

## Running it

```sh
npm install
npm run dev        # http://localhost:5173, with the editor
npm run build      # static site in dist/, read-only
npm run preview    # serve dist/ locally
npm run lint       # Biome; lefthook also formats on commit and lints on push
```

## Editing content

Editing only exists under `npm run dev`. Open http://localhost:5173 and:

- **Add link** (top right, or on a project) opens the link dialog: the link,
  its type, a title (optional: without one, the card is named by its type,
  "Figma design"), its project, the date it was last updated (today unless
  you change it), whether it's the latest, and a thumbnail.
- **Thumbnails:** upload one, drop an image on the box, or click the box and
  paste. Pasting an image anywhere in the dialog works too (pasting text into
  a field still pastes the text). Images are shrunk to 1200px wide and saved
  as WebP in `public/thumbs/<link-id>.webp`. Without one, the card shows the
  type's icon on its colour.
- **Latest:** one link of each type per project can carry the Latest tag.
  Marking one takes the tag from the others.
- **Reorder** by dragging a card (within a project or into another) or a
  project's grip handle (⋮⋮). From the keyboard, use the move menu (⇅) on a
  card or a project heading.
- **Projects:** New project, and Edit on each project: its name, and an
  optional description by the name. Edit is also where to delete
  one (it asks first, and says how many links go with it).
- **Delete a link** from its edit dialog; its thumbnail file goes too.

Every change is written straight to `src/data/dashboard.json` (and
`public/thumbs/`) by the dev server, checked against the same rules the page
uses (`src/lib/dashboard.js`). Then:

```sh
git diff                  # see what changed
git commit -am "Add PEAT snapshot"   # add new thumbnails with git add
git push                  # deploys (see Hosting)
```

Which projects a visitor has collapsed is kept in their own browser, not in
the file.

## Hosting

Cloudflare Workers serves `dist/` as static files (`wrangler.jsonc`), at
`https://prototype-dashboard.<account>.workers.dev/`. Every push to `main`
deploys it (`.github/workflows/deploy.yml`): lint, build with the components
page and analytics off, then `wrangler deploy`.

### Setting it up (once)

1. **Cloudflare account.** Any free account works; it doesn't need Nesta's
   Cloudflare or DNS. Note the **Account ID** (Workers & Pages overview,
   right-hand side).
2. **API token.** My Profile → API Tokens → Create Token → the "Edit
   Cloudflare Workers" template, limited to that account.
3. **GitHub secrets.** In this repo's Settings → Secrets and variables →
   Actions, add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. **First deploy.** Push to `main` (or run the workflow by hand from the
   Actions tab). The worker appears in Workers & Pages.
5. **Cloudflare Access.** In the worker's Settings → Domains & Routes, turn on
   Cloudflare Access for the `workers.dev` route. That creates an Access
   application covering all traffic. Then in Zero Trust → Access →
   Applications, edit its policy:
   - Action **Allow**, Include **Emails ending in** `@nesta.org.uk`.
   - Login method: **One-time PIN** (on by default): a code is emailed to
     the address entered.

   Zero Trust asks for a team name and a plan the first time; the free plan
   covers up to 50 users. Check by opening the address in a private window:
   you should get the Access login page, and a non-Nesta address should get
   no code.
6. **Later, Google login.** Zero Trust → Settings → Authentication → add
   Google as a login method, then enable it on the application.

Cloudflare's dashboard moves things around now and then; the names above are
what to look for.

## Later

The data and its rules are kept separate from the page so these can be added
without reworking it:

- **Editing from the live site:** commit `src/data/dashboard.json` (and
  thumbnails) through the GitHub API with a fine-grained token scoped to this
  repo. The push deploys as above. `validateDashboard` in
  `src/lib/dashboard.js` is the check to run before committing.
- **`npm run thumbs`:** Playwright screenshots of every `live` link into
  `public/thumbs/<link-id>.webp`. Figma thumbnails stay manual (paste or drop).

## Feature flags

Each flag is `VITE_FLAG_<NAME>=on|off`, with its default in `src/flags.js` and
a line in `.env.example`. Analytics is off by default: the dashboard is an
internal page, and its visits aren't IGL website traffic. The deploy workflow
sets the live site's flags itself.

`AGENTS.md` has the rest: where things are, the IGL palette and components,
and how to check visual changes with before/after screenshots.
