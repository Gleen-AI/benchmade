# Benchmade Knife Finder embed

Copy-and-paste integration for loading the Alhena-hosted quiz into Benchmade's
Shopify pages, with Visually controlling the experiment assignment.

Quiz content, styles, images, and JavaScript load from
[Alhena Studio](https://benchmade-9c8f406672.alhena-studio.pages.dev/).
This repository contains the integration snippets and a standalone demo.

## Files

- `benchmade-shopify-page.html`: paste into the new Shopify page's Custom Liquid
  section for the **redirect test** described below.
- `benchmade-visually-variant.js`: paste into the Visually test variant's Custom JavaScript field.
- `benchmade-visually-variant.html`: the same integration wrapped in a script tag,
  for a test-only HTML insertion that executes scripts.
- `standalone-preview.html`: a complete demo page with its own Alhena SDK setup.

## Redirect test: separate Shopify page (current setup)

1. Create `/pages/knife-finder-2` with its own page template containing a **Custom
   Liquid** section (or a Custom HTML section that executes inline scripts).
   Assign this template only to the new page. Keep `/pages/knife-finder` on its
   existing template, and omit the old Cartful quiz section from the new template.
2. Copy the **entire contents** of `benchmade-shopify-page.html` into that section,
   once. This is an HTML fragment; do not add outer `html`, `head`, or `body` tags.
   Use the theme section, not the page's rich-text editor, which may strip scripts.
3. Keep the existing Alhena Shopify SDK installation enabled on the new template.
   The fragment reuses it and preserves its configuration; it does not install a
   second SDK or configure the chat widget. The quiz loads automatically, including
   when someone visits the new page directly, without an old quiz container.
4. In Visually, configure a redirect experiment starting at `/pages/knife-finder`.
   Keep control visitors there and redirect test visitors to `/pages/knife-finder-2`.
   Exclude the destination from the redirect rule to avoid a loop. Disable the
   previous same-page replacement variant for this experiment; do not also run
   `benchmade-visually-variant.js` or paste its HTML wrapper.
5. Preview both pages on desktop and mobile before enabling the traffic split.
   Verify sticky assignment and purchase/revenue attribution in Visually, including
   navigation from quiz results through products and checkout.

The fragment waits up to 30 seconds for the SDK and another 30 seconds for the
first answer buttons. If either fails, it displays a refresh message and hides the
incomplete quiz, including a mount that finishes late. If consent prevents SDK
loading past the timeout, refresh after consent is granted. It does not bypass
consent, redirect visitors, or assign experiment groups.

The readiness check uses `#options button[data-choice]` from the hosted quiz.
Refresh the storefront preview after theme edits; live section replacement in the
theme editor and SPA navigation are not supported by this fragment.

## Same-page test: original alternative

Use this only for an experiment that replaces the old quiz on the same URL.

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

### Same-page loading and experiment behavior

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

On 2026-10-26, the separate-page fragment passed local browser checks using the
live Alhena SDK and hosted quiz at desktop 1440x1000 and mobile 390x844 sizes:

- Fragment inserted before and after SDK loading, with no old quiz container.
- All six first-question choices rendered; selection enabled Continue.
- One SDK load, preserved SDK configuration, no horizontal page overflow, and
  duplicate script execution preserved the selected answer.
- Simulated delayed/absent SDK, no-op stub, rejected mount, incomplete/late markup,
  and section removal behaved as expected.

Background POST requests were blocked during these checks. The Shopify theme,
Visually redirects/attribution, AI results, email signup, cart, and checkout still
need validation in the store's experiment preview before launch.

On 2026-10-21, the original same-page integration was checked with the live SDK on a local
test page at desktop 1440x1000 and mobile 390x844 viewport sizes. Verified rendering,
old-quiz hiding after readiness, answer selection, Continue becoming enabled,
no horizontal overflow, one SDK script, and duplicate-run prevention.

Simulated delayed SDK readiness, interaction with the old quiz, an absent SDK,
and incomplete/late quiz markup preserved the old quiz. Background POST requests
were blocked during these checks.

Actual Shopify theme behavior, Visually assignment, consent flows, AI results,
product navigation, cart operations, checkout, and analytics attribution still
need validation in the store's experiment preview before launch.
