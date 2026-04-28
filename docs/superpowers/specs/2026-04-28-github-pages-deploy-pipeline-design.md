# GitHub Pages Deploy Pipeline — Design Spec

**Date:** 2026-04-28

## Problem

The app has a web target but no automated way to publish it. Developers must manually build and host the web output.

## Goal

A manual GitHub Actions workflow that builds the Expo web static export and deploys it to GitHub Pages at `https://beingdpkpr.github.io/personal-finance/`.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Trigger | `workflow_dispatch` (manual) | Controlled deployments, no accidental publishes on every push |
| Domain | Default GitHub Pages URL | No custom domain needed |
| Branch | `main` only | Single source of truth |
| Deploy method | GitHub native Pages API | No extra branch, no 3rd-party dependency |
| Base URL | `/personal-finance` hardcoded in `app.json` | Fixed value; only affects static export, not dev server |

## Architecture

Two GitHub Actions jobs:

1. **build** — checks out `main`, installs deps, runs `npx expo export --platform web`, uploads `dist/` as a Pages artifact
2. **deploy** — consumes the artifact via GitHub's Pages API and publishes it

`app.json` gets `experiments.baseUrl: "/personal-finance"` so Expo Router generates correct asset and route URLs for the subpath.

## Files

| File | Change |
|---|---|
| `.github/workflows/deploy-gh-pages.yml` | Create — the pipeline |
| `app.json` | Modify — add `baseUrl` to `experiments` |

## One-Time Repo Setup (manual)

In GitHub repo Settings → Pages → Source: set to **"GitHub Actions"**.

## Verification

1. Push changes to `main`
2. GitHub Actions → "Deploy to GitHub Pages" → "Run workflow"
3. Both jobs pass
4. `https://beingdpkpr.github.io/personal-finance/` loads the app
5. Navigation/routing works (no 404s on links)
