# Benchmade Knife Finder embed

Copy-and-paste integration for loading the Alhena-hosted quiz into Benchmade's
Shopify Knife Finder page, with Visually controlling the experiment assignment.

Quiz content, styles, images, and JavaScript load from
[Alhena Studio](https://benchmade-9c8f406672.alhena-studio.pages.dev/).
This repository contains the integration snippets and a standalone demo.

## Files

- `benchmade-visually-variant.js`: paste into the Visually test variant's Custom JavaScript field.
- `benchmade-visually-variant.html`: the same integration wrapped in a script tag,
  for a test-only HTML insertion that executes scripts.
- `standalone-preview.html`: a complete demo page with its own Alhena SDK setup.

## Shopify / Visually setup

1. Use the existing Benchmade Alhena Shopify installation on this page.
2. Target the experiment to the US `/pages/knife-finder` page.
3. Paste the contents of `benchmade-visually-variant.js` into the **test variant only**,
   without script tags. Leave the control variant unchanged.
4. Preview both variants on desktop and mobile before launch.

The script creates `#alhena-quiz-slot` before `.benchmade-finder-embed`, waits for
the installed SDK and the first quiz answer buttons, then hides the old quiz.
It preserves the store's SDK configuration and does not inject another SDK script.
No separate empty slot needs to be added to the theme.

Use either the JavaScript snippet or the HTML fragment, not both. HTML inserted
with `innerHTML` will not execute its script. Installing the code unconditionally
in the theme would show the variant to everyone on the targeted page.

## Loading and experiment behavior

- The old quiz stays visible on timeout or if a visitor starts using it first.
  Each loading stage has a 20-second timeout; failures appear in the browser console.
- If the SDK is absent or blocked by consent, the old quiz remains available.
  This snippet does not bypass the consent setup.
- Visually owns assignment and purchase reporting. Fallbacks keep their original
  assignment; this snippet does not add custom Visually funnel events.
- Hiding Cartful does not stop its assets downloading. Avoiding that download
  requires gating the old theme loader separately.
- The readiness check depends on `#options button[data-choice]` in this quiz.
  The old container selector was verified against the live page on 2026-10-20.
- Reload the page when switching variants in preview: Studio page scripts cannot
  be unloaded. This integration does not implement SPA variant teardown.

## Standalone preview

Run from the repository directory:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/standalone-preview.html`.
The quiz loads automatically. This file configures the SDK with `hideDefaultUI`
for the demo and has no experiment assignment. Do not paste the complete demo
page into the Shopify theme or Visually.

## Validation

On 2026-10-21, the integration was checked with the live Alhena SDK on a local
test page at desktop 1440x1000 and mobile 390x844 viewport sizes. Verified rendering,
old-quiz hiding after readiness, answer selection, Continue becoming enabled,
no horizontal overflow, one SDK script, and duplicate-run prevention.

Simulated delayed SDK readiness, interaction with the old quiz, an absent SDK,
and incomplete/late quiz markup preserved the old quiz. Background POST requests
were blocked during these checks.

Actual Shopify theme behavior, Visually assignment, consent flows, AI results,
product navigation, cart operations, checkout, and analytics attribution still
need validation in the store's experiment preview before launch.
