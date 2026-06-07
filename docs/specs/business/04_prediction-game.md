# Prediction Game

## 1. Product intent

The prediction game exists to increase engagement around upcoming races without introducing gambling behavior.

## 2. Point economy

### Sources
- blog rewards,
- event/admin rewards,
- fixed rewards from successful predictions.

### Uses
- pay a fixed entry cost to submit a prediction,
- appear on leaderboards,
- show progression and engagement.

## 3. Entry and reward rules

| Prediction type | Entry cost | Correct result | Reward |
| --- | ---: | --- | ---: |
| WINNER | 5 points | exact winner | 10 points |
| TOP3 | 10 points | exact order | 30 points |
| TOP3 | 10 points | correct three horses, wrong order | 15 points |

## 4. Safety boundaries

- no cash,
- no odds,
- no pools,
- no user-to-user redistribution,
- no prize exchange outside the system.

## 5. Cancellation

If a race is cancelled before evaluation:

- prediction status becomes `REFUNDED`,
- the fixed entry cost is returned,
- no reward is issued.

## 6. Leaderboard meaning

Leaderboards rank gameplay performance only. They do not represent financial value.

