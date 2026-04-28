# GitHub Pages Deploy Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual GitHub Actions workflow that builds and deploys the Expo web static export to GitHub Pages.

**Architecture:** Two jobs — `build` (exports static web output to `dist/`) and `deploy` (publishes via GitHub's native Pages API). `app.json` is updated with `baseUrl` so Expo Router generates correct subpath URLs.

**Tech Stack:** GitHub Actions, Expo Router (static export), `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`

---

### Task 1: Create the GitHub Actions workflow

**Files:**
- Create: `.github/workflows/deploy-gh-pages.yml`

- [ ] **Step 1: Create the workflows directory and file**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write `.github/workflows/deploy-gh-pages.yml`**

Create `.github/workflows/deploy-gh-pages.yml` with this exact content:

```yaml
name: Deploy to GitHub Pages

on:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx expo export --platform web
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-gh-pages.yml
git commit -m "ci: add manual GitHub Pages deploy workflow"
```

---

### Task 2: Configure Expo base URL for GitHub Pages subpath

**Files:**
- Modify: `app.json` (line 35–37, the `experiments` block)

The app will be served at `https://beingdpkpr.github.io/personal-finance/`. Without `baseUrl`, Expo Router generates asset URLs relative to `/` — they 404 on GitHub Pages. `baseUrl` fixes this for static exports only; the local dev server is unaffected.

- [ ] **Step 1: Update `app.json` `experiments` block**

In `app.json`, change:

```json
"experiments": {
  "typedRoutes": true
}
```

to:

```json
"experiments": {
  "typedRoutes": true,
  "baseUrl": "/personal-finance"
}
```

- [ ] **Step 2: Verify the change looks correct**

```bash
grep -A 4 '"experiments"' app.json
```

Expected output:
```
  "experiments": {
    "typedRoutes": true,
    "baseUrl": "/personal-finance"
  },
```

- [ ] **Step 3: Commit**

```bash
git add app.json
git commit -m "fix: set experiments.baseUrl for GitHub Pages subpath"
```

---

## One-Time GitHub Repo Setup (manual — user must do this)

Before triggering the workflow for the first time:

1. Go to the GitHub repo → **Settings** → **Pages**
2. Under **Source**, select **"GitHub Actions"**
3. Save

Without this, the `deploy` job will fail with a Pages configuration error.

---

## Verification

After both commits are on `main`:

1. Go to `https://github.com/beingdpkpr/personal-finance/actions`
2. Click **"Deploy to GitHub Pages"** in the left sidebar
3. Click **"Run workflow"** → **"Run workflow"** (runs on `main`)
4. Wait for both `build` and `deploy` jobs to show green checkmarks (~2–3 minutes)
5. Visit `https://beingdpkpr.github.io/personal-finance/`
6. The Finance app should load — verify the dashboard renders and tab navigation works without 404s
