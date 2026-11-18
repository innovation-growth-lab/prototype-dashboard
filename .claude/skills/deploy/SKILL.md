---
name: deploy
description: Deploy the prototype dashboard to innovationgrowthlab.org/tools/prototypes with deploy.sh, or check what's live. Use when someone asks to deploy, release, publish, ship or put the site live, or asks which version is live.
---

# Deploy to innovationgrowthlab.org/tools/prototypes

Deploying changes the live site and pushes a git tag, so the person confirms
before anything is published. Never use `--force` unless they ask for it.

1. **Check they can reach the server.** `deploy.sh` copies the site over ssh,
   so the person needs an `igl-website` alias in `~/.ssh/config`. The dry run
   below shows whether it works.

2. **Check the commit.** `deploy.sh` deploys only a clean, pushed, untagged
   commit. If `git status` shows changes, or HEAD isn't pushed
   (`git branch -r --contains HEAD` prints nothing), tell the person what's
   unpushed and ask before committing or pushing. For content edits, the
   change is `src/data/dashboard.json` plus any files in `public/thumbs/`:
   say, in plain terms, which projects and links changed.

3. **Work out the tag.** The latest is
   `git tag --list 'v*' --sort=-v:refname | head -n 1`. Suggest the next minor
   (`v0.3.0` after `v0.2.4`), or `v0.1.0` for the first deploy. A content-only
   or fix-only release can be the next patch (`v0.2.5`).

4. **Dry run.** `./deploy.sh --dry-run --tag=<tag>`. It builds, lists what would
   change on the server, and deletes the tag again. If ssh fails, stop: the
   person's ssh set-up needs fixing, not the script.

5. **Confirm.** Tell the person, in plain terms, which tag this will be, what's
   new since the last tag (`git log --oneline <last-tag>..HEAD`), any flags
   forced in `deploy.sh`'s `FLAGS`, and roughly what the dry run would change.
   Ask them to confirm.

6. **Deploy.** `./deploy.sh --tag=<tag>`. It prints the live URL when done.
   Check it: `curl https://www.innovationgrowthlab.org/tools/prototypes/VERSION`
   should show the new tag.

If the deploy fails partway, the script removes the tag, so it's safe to fix
the problem and run it again.
