# AI Race Insight

## 1. Current Status

The source tree contains an `aiinsight` package and database support for `ai_predictions` in legacy schema scripts, but the active implemented workflows focus on official race operations and spectator prediction. AI insight should be treated as an optional extension layer, not a source of official race truth.

## 2. Intended Boundary

AI race insight may provide:

- race context;
- participant comparison;
- probability-like educational hints;
- post-race explanation.

AI must not:

- decide official race results;
- change referee submissions;
- change tournament rankings;
- allocate wallet rewards directly;
- create, settle, or override betting odds.

## 3. Future Integration Shape

If implemented, AI output should be persisted separately from official result tables and exposed through read-only APIs. Any AI-generated insight should include timestamp, source model/config, and confidence fields so reviewers can distinguish it from official data.

## 4. Report Note

For the current project report, present AI insight as a future enhancement. The implemented engagement feature is the deterministic wallet-backed prediction game.
