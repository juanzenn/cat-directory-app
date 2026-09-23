# Lighthouse audit baseline

Captured against production: [https://cat-directory.juanalvarez.dev/](https://cat-directory.juanalvarez.dev/)

Detail URL used: `/breeds/abyssinian`

Tooling: `npx lighthouse` with default categories (Performance, Accessibility, Best Practices, SEO), desktop via `--preset=desktop`, mobile via Lighthouse default (Slow 4G + CPU throttle). HTML + JSON artifacts live in [`docs/lighthouse/`](./lighthouse/).

## Scores

Threshold from the brief: **≥90** in each category. Only mobile detail Performance is below that.

| Page | Form factor | Performance | Accessibility | Best Practices | SEO |
|------|-------------|-------------|---------------|----------------|-----|
| Index `/` | Desktop | **99** | **100** | **100** | **100** |
| Index `/` | Mobile | **100** | **100** | **100** | **100** |
| Detail `/breeds/abyssinian` | Desktop | **97** | **100** | **100** | **100** |
| Detail `/breeds/abyssinian` | Mobile | **86** | **100** | **100** | **100** |

## Core metrics

### Index (desktop)

| Metric | Value |
|--------|-------|
| FCP | 0.3 s |
| LCP | 0.5 s |
| TBT | 0 ms |
| CLS | 0.047 |
| Speed Index | 1.1 s |
| TTI | 0.5 s |
| TTFB (document) | 280 ms |

### Index (mobile)

| Metric | Value |
|--------|-------|
| FCP | 1.0 s |
| LCP | 1.2 s |
| TBT | 30 ms |
| CLS | 0 |
| Speed Index | 1.6 s |
| TTI | 2.6 s |
| TTFB (document) | 130 ms |

### Detail (desktop)

| Metric | Value |
|--------|-------|
| FCP | 0.7 s |
| LCP | 1.2 s |
| TBT | 0 ms |
| CLS | 0.005 |
| Speed Index | 0.7 s |
| TTI | 1.2 s |
| TTFB (document) | 130 ms |

### Detail (mobile)

| Metric | Value |
|--------|-------|
| FCP | 1.0 s |
| LCP | **4.2 s** |
| TBT | 70 ms |
| CLS | 0.019 |
| Speed Index | 1.1 s |
| TTI | **4.2 s** |
| TTFB (document) | 210 ms |

## Findings

### Strengths

- Accessibility, Best Practices, and SEO are **100** on every run (Home and Detail, desktop and mobile).
- Index Performance is excellent on both form factors (99 / 100).
- Detail desktop Performance clears the ≥90 bar (97).
- FCP, TBT, and CLS stay strong across runs; document TTFB is healthy (~130–280 ms).

### Below threshold: mobile detail Performance (86)

The **86** mobile detail score is driven by LCP (4.2 s). TTI matches LCP, which points at main-content paint waiting on JS rather than large images.

That matches the current detail architecture: `CatDetail` is a client component that resolves the breed from the infinite cats query (and may page-fetch until the slug is found). Under Lighthouse mobile throttling that path costs far more than on desktop (detail desktop LCP is 1.2 s).

Unthrottled observed LCP on the same detail-mobile run was ~0.8 s, so lab mobile is pessimistic — but it remains the right optimization target if phone scores matter.

**Mitigation:** SSR/stream the breed card, or pass resolved breed data from the server page so the heading and fields are not gated on client query status / extra pages. The public API has no `/breeds/[id]` endpoint, so any single-breed resolve still walks paginated `/breeds` (or caches a lookup table).

### Secondary notes

- **Unused JavaScript** (~107 KiB) appears on detail mobile from Next chunks. Estimated savings are secondary to LCP.
- Third-party origins seen: `catfact.ninja` (random fact) and Cloudflare Insights. Unlikely the primary LCP driver vs app JS.

## Recommended next steps

1. Treat Accessibility / Best Practices / SEO / index Performance as intentional baseline — no urgent work.
2. Improve **detail LCP on mobile** if the ≥90 Performance bar must pass on every form factor (SSR breed resolution).
3. Optionally trim unused JS / split detail-only code after LCP is fixed.

## How to re-run

```bash
# Desktop (all default categories)
npx --yes lighthouse https://cat-directory.juanalvarez.dev/ \
  --output=html,json --output-path=./docs/lighthouse/lighthouse-index \
  --chrome-flags="--headless --no-sandbox" \
  --preset=desktop

npx --yes lighthouse https://cat-directory.juanalvarez.dev/breeds/abyssinian \
  --output=html,json --output-path=./docs/lighthouse/lighthouse-detail \
  --chrome-flags="--headless --no-sandbox" \
  --preset=desktop

# Mobile (omit --preset=desktop)
npx --yes lighthouse https://cat-directory.juanalvarez.dev/ \
  --output=html,json --output-path=./docs/lighthouse/lighthouse-index-mobile \
  --chrome-flags="--headless --no-sandbox"

npx --yes lighthouse https://cat-directory.juanalvarez.dev/breeds/abyssinian \
  --output=html,json --output-path=./docs/lighthouse/lighthouse-detail-mobile \
  --chrome-flags="--headless --no-sandbox"
```
