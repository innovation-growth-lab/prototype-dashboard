---
name: deploy
description: Deploy the prototype dashboard to Cloudflare Workers, or check what's live. Use when someone asks to deploy, release, publish, ship or put the site live, or asks which version is live.
---

# Deploy to Cloudflare Workers

Pushing to `main` deploys: `.github/workflows/deploy.yml` lints, builds and
runs `wrangler deploy`. So a push publishes, and the person confirms before
anything is pushed.

1. **Check the change.** `git status` and `git diff`. For content edits, the
   diff is `src/data/dashboard.json` plus any files in `public/thumbs/`: tell
   the person, in plain terms, which projects and links changed.
2. **Check it builds.** `npm run lint` and `npm run build`.
3. **Confirm.** Say what will go live and ask before committing and pushing.
   Commit on `main` only if that's how the person works; otherwise a branch
   and a pull request, which deploys when merged.
4. **Push**, then watch the run: `gh run watch` (or `gh run list
   --workflow=deploy.yml`). If it fails at the deploy step with an auth error,
   the repository secrets need setting (README, Hosting); don't work round it.
5. **Check it's live.** The address is
   `https://prototype-dashboard.<account>.workers.dev/`. It's behind
   Cloudflare Access, so a plain `curl` gets the Access login page (a 302 or
   403), which itself shows Access is on. Ask the person to open it.

Never run `wrangler deploy` from a laptop unless the person asks: the
workflow's build is the one with the live site's flags.
