# Lighthouse performance baseline

Captured against production: [https://cat-directory.juanalvarez.dev/](https://cat-directory.juanalvarez.dev/)

Detail URL used: `/breeds/abyssinian`

Tooling: `npx lighthouse` with `--only-categories=performance`, desktop via `--preset=desktop`, mobile via Lighthouse default (Slow 4G + CPU throttle). HTML + JSON artifacts live in [`docs/lighthouse/`](./lighthouse/).

## Scores

| Page | Desktop | Mobile |
|------|---------|--------|
| Index `/` | **99** | **100** |
| Detail `/breeds/abyssinian` | **95** | **81** |

## Core metrics

### Index (desktop)

| Metric | Value |
|--------|-------|
| FCP | 0.4 s |
| LCP | 0.6 s |
| TBT | 0 ms |
| CLS | 0.047 |
| Speed Index | 1.1 s |
| TTI | 0.6 s |
| TTFB (document) | 270 ms |

### Index (mobile)

| Metric | Value |
|--------|-------|
| FCP | 1.0 s |
| LCP | 1.1 s |
| TBT | 30 ms |
| CLS | 0 |
| Speed Index | 2.1 s |
| TTI | 2.4 s |
| TTFB (document) | 140 ms |

### Detail (desktop)

| Metric | Value |
|--------|-------|
| FCP | 0.4 s |
| LCP | 1.5 s |
| TBT | 0 ms |
| CLS | 0.009 |
| Speed Index | 0.5 s |
| TTI | 1.5 s |
| TTFB (document) | 120 ms |

### Detail (mobile)

| Metric | Value |
|--------|-------|
| FCP | 1.0 s |
| LCP | **5.1 s** |
| TBT | 70 ms |
| CLS | 0.01 |
| Speed Index | 1.9 s |
| TTI | **5.1 s** |
| TTFB (document) | 200 ms |

## Findings

### Strengths

- Index performance is excellent on both desktop and mobile (99 / 100).
- FCP, TBT, and CLS are strong across all four runs.
- Document TTFB is healthy (~120–270 ms); the origin is not the bottleneck.

### Main issue: mobile detail LCP

The **81** mobile detail score is almost entirely LCP (5.1 s). TTI matches LCP, which points at main-content paint waiting on JS rather than large images (these runs transferred **0 image bytes** on detail).

That matches the current detail architecture: `CatDetail` is a client component that resolves the breed from the infinite cats query (and may page-fetch until the slug is found). Under Lighthouse mobile throttling that path costs far more than on desktop (detail desktop LCP is still a soft 1.5 s).

Unthrottled observed LCP on the same detail-mobile run was ~0.9 s, so lab mobile is pessimistic — but it remains the right optimization target if phone scores matter.

### Secondary notes

- **Unused JavaScript** (~107–112 KiB) appears on every run from the same Next chunks. Estimated savings are small on index/desktop and ~810 ms on mobile detail.
- Third-party origins seen: `catfact.ninja` (random fact) and Cloudflare Insights. Unlikely the primary LCP driver vs app JS.

## Recommended next steps

1. Treat index scores as intentional baseline — no urgent work.
2. Improve **detail LCP on mobile**: SSR/stream the breed card, or pass resolved breed data from the server page so the heading and fields are not gated on client query status / extra pages.
3. Optionally trim unused JS / split detail-only code after LCP is fixed.

## How to re-run

```bash
# Desktop
npx --yes lighthouse https://cat-directory.juanalvarez.dev/ \
  --output=html,json --output-path=./docs/lighthouse/lighthouse-index \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance --preset=desktop

npx --yes lighthouse https://cat-directory.juanalvarez.dev/breeds/abyssinian \
  --output=html,json --output-path=./docs/lighthouse/lighthouse-detail \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance --preset=desktop

# Mobile (omit --preset=desktop)
npx --yes lighthouse https://cat-directory.juanalvarez.dev/ \
  --output=html,json --output-path=./docs/lighthouse/lighthouse-index-mobile \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance

npx --yes lighthouse https://cat-directory.juanalvarez.dev/breeds/abyssinian \
  --output=html,json --output-path=./docs/lighthouse/lighthouse-detail-mobile \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance
```
