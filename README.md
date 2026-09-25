# ascendfitness.ai

Static marketing + legal site for **Ascend: AI Fitness & Nutrition** (iOS).
Hosted on GitHub Pages from `main`; the custom domain is in `CNAME`.

## Layout

| Path | What it is |
|---|---|
| `index.html` | Launch homepage (hero, features, how it works, nutrition, progress, AI coach, download CTA) |
| `privacy.html`, `terms.html`, `manage-subscription.html` | Legal / support pages. Self-contained (inline CSS), linked from inside the app |
| `assets/css/site.css` | Homepage stylesheet (design tokens at the top) |
| `assets/js/site.js` | Nav, mobile menu, scroll reveals, parallax, tilt, adaptive-demo screen swap |
| `assets/js/social.js` | **The one place social handles live.** Empty value = icon hidden |
| `assets/img/` | Logo (unchanged Ascend mark), favicons, OG image, real app screenshots in `screens/` |
| `robots.txt`, `sitemap.xml` | SEO |

## Editing

- **Social links:** edit `assets/js/social.js`. Instagram and TikTok are `@ascend.ios`.
  YouTube / X / Facebook are blank until those accounts exist.
- **App Store link:** search-and-replace `id6790593276` if it ever changes (it is in the
  HTML, `social.js`, and the JSON-LD).
- **Screenshots:** `assets/img/screens/*.{webp,png}` are 720 px wide captures of the
  shipped app in the default dark-indigo theme. Regenerate all of them together so the
  colour scheme stays consistent.
- No build step. Push to `main` and Pages deploys.
