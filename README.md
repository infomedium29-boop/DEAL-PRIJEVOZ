# DEAL — Premium Services

Production-ready multi-page, multilingual website for DEAL, built for GitHub + Cloudflare Pages.

## What is included

- Premium dark/copper visual system based on the client-approved direction
- 4 languages: HR / EN / DE / NL
- Separate hubs for Taxi & Transfers, Travel, Clean and DEAL Driver Hire
- Dynamic detail pages generated from `content/content.json`
- Fleet, About, Contact, Privacy and Cookies pages
- SEO: semantic HTML, canonical URLs, hreflang, JSON-LD, sitemap, robots.txt
- Responsive layout from mobile to large desktop
- Lightweight animations without animation libraries
- Cookie consent with analytics blocked until consent
- Contact forms via Cloudflare Pages Function + optional Web3Forms delivery
- Custom CMS at `/admin/`
- Client can add new services, trips, destinations and standalone pages without editing code
- CMS saves content directly to GitHub and triggers a fresh Cloudflare deployment
- Optional Cloudflare KV inbox for form enquiries
- Image upload from CMS to `public/uploads/`

## Cloudflare Pages deploy

Use these settings:

- Framework preset: **None**
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

Cloudflare automatically deploys the Pages Functions from the `/functions` directory.

## CMS setup

The public website works immediately after deployment. To enable `/admin/`, add these Cloudflare Pages runtime variables/secrets:

### Required

- `ADMIN_PASSWORD` — the password the client will use to enter `/admin/`
- `SESSION_SECRET` — a long random string (recommended 32+ characters)
- `GITHUB_TOKEN` — a fine-grained GitHub token with **Contents: Read and write** permission only for this repository
- `GITHUB_OWNER` — GitHub username or organisation
- `GITHUB_REPO` — repository name
- `GITHUB_BRANCH` — usually `main`

The GitHub token stays server-side inside Cloudflare Pages Functions and is never exposed in browser JavaScript.

### Contact form

Add:

- `WEB3FORMS_KEY` — Web3Forms access key for e-mail delivery

Optional:

- Create a Cloudflare KV namespace and bind it to the Pages project under the binding name `DEAL_DATA`.

If `DEAL_DATA` is enabled, form submissions are also visible in the CMS under **Upiti** for up to 180 days. Personal enquiry data is never written into the GitHub repository.

## How content publishing works

1. Client logs in at `/admin/`.
2. Client edits or adds a service, trip, destination, fleet item or translated text.
3. CMS commits the updated `content/content.json` to GitHub.
4. Cloudflare detects the commit and runs `npm run build`.
5. The static SEO-friendly page is regenerated and deployed.

This means newly added Travel/Taxi/Clean/Driver pages get real static URLs and can be indexed by search engines.

## Images

Initial visual assets are in `public/assets/images/`. They are supplied in AVIF and WebP where appropriate. New CMS uploads are stored in `public/uploads/`.

## Important before final launch

Replace or confirm:

- e-mail, phone and company/legal details
- social media links if used
- exact fleet names/capacities
- final Privacy Policy / Cookies wording with the client's legal requirements
- Web3Forms access key
- analytics ID, if analytics is wanted

