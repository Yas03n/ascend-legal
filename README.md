# ascendfitness.ai

Static marketing, blog, and legal site for **Ascend Fitness & Nutrition** (iOS).
Hosted on GitHub Pages from `main`; the custom domain is in `CNAME`. Merging to `main` publishes the site.

## Layout

| Path | What it is |
|---|---|
| `index.html` | Homepage: product, FAQ, download |
| `blog/` | Beginner guides (training, protein, restaurants) |
| `restaurants/` | Protein numbers quoted from Chipotle, Chick-fil-A, and In-N-Out |
| `404.html` | Custom not-found page (GitHub Pages) |
| `privacy.html`, `terms.html`, `consumer-health-data.html`, `manage-subscription.html` | Legal and support pages. Self-contained, linked from the app |
| `assets/css/site.css` | Marketing and blog stylesheet |
| `assets/js/site.js` | Theme, reveals, phone screens |
| `assets/js/social.js` | The one place social handles live |
| `assets/fonts/` | Self-hosted Inter (latin, variable) |
| `assets/img/` | Logo, favicons, screenshots |
| `robots.txt`, `sitemap.xml` | Crawling |

## Editing

- **Social links:** edit `assets/js/social.js`.
- **App Store link:** search for `id6790593276` if it ever changes.
- **Screenshots:** `assets/img/screens/`. Each screen has a 780 px WebP and AVIF plus a 500 px version. The phone frame uses `sizes` so small screens fetch the smaller file.
- **Fonts:** Inter is self-hosted. Do not add a third-party font stylesheet back.
- **Restaurant numbers:** only quote a chain’s own nutrition page, and keep the source URL and the date in the guide.
- No build step. No analytics. Push to `main` and Pages deploys.

## Search Console

After a merge, submit `https://ascendfitness.ai/sitemap.xml` in Google Search Console if the property is verified. Indexing is not instant.
