# AI Race Insight

AI Race Insight is a support feature for spectators. It highlights notable participants before a race, but it never places predictions, never changes official results, and never replaces referee or admin decisions.

## 1. Inputs

- horse recent form,
- horse win rate,
- jockey win rate,
- distance compatibility,
- track condition compatibility.

## 2. Suggested scoring

```text
score =
  horseWinRate * 0.35 +
  jockeyWinRate * 0.25 +
  recentForm * 0.25 +
  distanceCompatibility * 0.15
```

## 3. Outputs

- ranked participant list,
- relative confidence,
- explanation text for each highlighted participant.

## 4. Why this scope is appropriate

- useful to spectators,
- easy to demo,
- testable with deterministic inputs,
- small enough not to dominate the project.

