# @neomokdeul/db

Static data package for the 너목들 (너의 목소리가 들려) marketing landing page.

## Source data

Aggregated from three post-program satisfaction survey exports (Tally CSV format, UTF-8 with BOM):

| Cohort ID | Period    | Responses |
|-----------|-----------|-----------|
| `0820`    | 2025년 8월 | 34        |
| `0924`    | 2025년 9월 | 53        |
| `1218`    | 2025년 12월 | 19        |

Surveys collected: overall satisfaction rating (1–5), friend-recommendation intent (yes/no), and free-text feedback.

## Privacy

All participant names and phone numbers have been stripped. The `reviews.json` file contains anonymized quote text only — no fields that can identify individuals. Quotes were additionally screened against phone-number and email regex patterns before inclusion.

## Files

- `data/reviews.json` — 18 curated participant quotes (id, quote, rating 1–5, cohort, cohortLabel)
- `data/stats.json` — aggregate stats: totalParticipants, averageRating, recommendRate, per-cohort breakdown

## Usage

```ts
import { reviews, stats } from '@neomokdeul/db';
import type { Review, Stats } from '@neomokdeul/db';

// All quotes
console.log(reviews[0].quote);

// Overall stats
console.log(stats.averageRating);   // e.g. 4.32
console.log(stats.recommendRate);  // e.g. 85

// Per-cohort
stats.cohorts.forEach(c => {
  console.log(c.label, c.avgRating, c.recommendRate);
});
```

You can also import JSON directly:

```ts
import reviewsJson from '@neomokdeul/db/data/reviews.json' with { type: 'json' };
import statsJson from '@neomokdeul/db/data/stats.json' with { type: 'json' };
```
