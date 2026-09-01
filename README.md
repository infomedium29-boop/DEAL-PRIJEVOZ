# DEAL — Premium Services + CMS

Production-ready multilingual DEAL website for GitHub + Cloudflare Pages with a custom owner-facing CMS at `/admin/`.

## Website

- 4 languages: HR / EN / DE / NL
- Premium responsive design
- Taxi & Transfers, Travel, Clean and DEAL Driver Hire
- Dynamic SEO-friendly detail pages
- Fleet, About, Contact, Privacy and Cookies
- Sitemap, hreflang, canonical URLs and JSON-LD
- Cloudflare Pages Functions for CMS and enquiries

## CMS capabilities

The owner can log in at `/admin/` and edit without touching code:

- homepage hero and section copy on all 4 languages
- the four main DEAL service divisions
- main service descriptions and images
- page-specific CTA blocks
- page-specific benefits / selling points
- Taxi, Travel, Clean and Driver subpages
- add new trips, transfers, cleaning services and driver pages
- publish/unpublish items as draft vs public
- upload and replace images
- SEO title and meta description per language
- fleet vehicles, images and capacities
- About and Contact page content
- contact-form labels and messages
- extra standalone pages, including navigation visibility
- Privacy Policy and Cookies text
- phone, WhatsApp, email, locations and navigation labels
- optional enquiry inbox through Cloudflare KV

Each CMS save writes `content/content.json` to GitHub. GitHub history therefore also acts as a versioned backup. Cloudflare detects the commit, runs `npm run build` and publishes the new static SEO-friendly website.

## Cloudflare Pages build settings

- Framework preset: **None**
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

## Enable CMS

Add the following under Cloudflare Pages → Settings → Environment variables / Secrets for **Production**:

### Required

- `ADMIN_PASSWORD` — password the owner will use at `/admin/`
- `SESSION_SECRET` — long random secret, ideally 32+ characters
- `GITHUB_TOKEN` — fine-grained GitHub token with **Contents: Read and write** for this repository only
- `GITHUB_OWNER` — `infomedium29-boop`
- `GITHUB_REPO` — `DEAL-PRIJEVOZ`
- `GITHUB_BRANCH` — `main`

Never commit `ADMIN_PASSWORD`, `SESSION_SECRET` or `GITHUB_TOKEN` into GitHub source files.

## GitHub token

Create a fine-grained personal access token and restrict it to only the `DEAL-PRIJEVOZ` repository. The token needs repository permission:

- **Contents: Read and write**

No broader GitHub permissions are required for the CMS publishing flow.

## Contact form

For e-mail delivery add:

- `WEB3FORMS_KEY` — Web3Forms access key

Optional CMS enquiry inbox:

1. Create a Cloudflare KV namespace.
2. Bind it to the Pages project using binding name `DEAL_DATA`.

When enabled, enquiries can be viewed in CMS under **Upiti** and are stored for up to 180 days. Personal enquiry data is not written to GitHub.

## Images uploaded from CMS

CMS accepts image uploads, resizes large images in the browser and stores an optimized WebP file in `public/uploads/`. Existing curated site artwork remains AVIF/WebP. If the owner directly uploads an AVIF file within the size limit, it is kept as AVIF.

## Publishing safety

- CMS sessions are HttpOnly, Secure and SameSite=Strict.
- State-changing CMS calls require same-origin requests.
- CMS detects if the GitHub content changed in another session and refuses to overwrite a newer version.
- Draft items are not built, indexed or added to navigation until published.
- Slugs are validated before publishing.

