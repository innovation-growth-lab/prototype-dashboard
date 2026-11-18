# Prototype dashboard

One page listing IGL's prototypes by project: live prototypes, dated
snapshots, Figma designs and prototypes, Miro boards and other links, each as
a card that opens in a new tab. Built on IGL's frontend boilerplate (Vite,
React Router, Tailwind), styled after IGL's brand but rounder and with
Mulish throughout (see `design/` for the mockup), prerendered to static HTML,
and hosted at https://www.innovationgrowthlab.org/tools/prototypes/.

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
git push
./deploy.sh               # puts it live (see Hosting)
```

Which projects a visitor has collapsed is kept in their own browser, not in
the file.

## Hosting

The site lives on the IGL WordPress server (Apache) at
https://www.innovationgrowthlab.org/tools/prototypes/. Pushing to GitHub
doesn't deploy; `./deploy.sh` does:

```sh
./deploy.sh --dry-run    # build, and list what would change on the server
./deploy.sh              # build, copy dist/ to the server, tag the release
```

It needs ssh access to the server, through an `igl-website` alias in
`~/.ssh/config`. It builds for the `/tools/prototypes/` path with the
components page and analytics off (its `FLAGS` list, whatever `.env` says),
copies `dist/` over with rsync, and adds `deploy/.htaccess` (the not-found
page, and no caching of pages). It deploys only a clean, pushed, untagged
commit, and asks for the next `v*` tag (`--tag=v1.2.3` to skip the question).
`--force` skips the checks and the tag, to redeploy or try out uncommitted
changes.

To check what's live:

```sh
curl https://www.innovationgrowthlab.org/tools/prototypes/VERSION
```

Every valid URL must be a prerendered file: the server has no fallback to
`index.html`.

## Later

The data and its rules are kept separate from the page so these can be added
without reworking it:

- **Cloudflare Workers behind Cloudflare Access,** to limit the dashboard to
  `@nesta.org.uk` addresses. A working set-up (a `wrangler.jsonc`, a GitHub
  Actions deploy on push, and the Access steps in this README) is in commit
  8051455: `git show 8051455 -- wrangler.jsonc .github README.md`.

- **Editing from the live site:** commit `src/data/dashboard.json` (and
  thumbnails) through the GitHub API with a fine-grained token scoped to this
  repo, then deploy as above. `validateDashboard` in
  `src/lib/dashboard.js` is the check to run before committing.
- **`npm run thumbs`:** Playwright screenshots of every `live` link into
  `public/thumbs/<link-id>.webp`. Figma thumbnails stay manual (paste or drop).

## Feature flags

Each flag is `VITE_FLAG_<NAME>=on|off`, with its default in `src/flags.js` and
a line in `.env.example`. Analytics is off by default: the dashboard is an
internal page, and its visits aren't IGL website traffic. `deploy.sh` sets
the live site's flags itself (its `FLAGS` list), and writes them to
`dist/VERSION`.

`AGENTS.md` has the rest: where things are, the IGL palette and components,
and how to check visual changes with before/after screenshots.
