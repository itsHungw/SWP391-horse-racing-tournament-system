# First Login Bonus Design

## Purpose

Grant a one-time point bonus the first time a user successfully logs in, using
the configurable `FIRST_LOGIN_BONUS` point setting. This rewards account
activation without hard-coding the amount and without granting the bonus more
than once per user.

This design covers only the award flow. The configurable amount is owned by the
Admin Point Settings module (see
`2026-06-03-admin-point-settings-design.md`); the point balance and ledger are
owned by the Point Account foundation (see
`2026-06-03-user-point-account-foundation-design.md`).

## Current Project Context

- Backend: Spring Boot under
  `backend/src/main/java/com/example/horseracingtournamentsystem`.
- Award logic: `point/service/FirstLoginBonusService.java`.
- Trigger point: `auth/service/AuthService.java` (`login`).
- Settings source: `point/service/PointSettingsService.java`.
- Ledger/balance: `point/service/PointAccountService.java`,
  `point/repository/PointTransactionRepository.java`.
- Transaction type enum: `point/entity/PointTransactionType.java`.

## Trigger

`AuthService.login` calls `firstLoginBonusService.awardIfEligible(user)` after
credentials are validated and before the login is recorded and tokens are
issued. The call runs inside the login transaction.

## Eligibility And Idempotency

`awardIfEligible(User user)`:

1. Read `FIRST_LOGIN_BONUS` from point settings. If `<= 0`, do nothing (feature
   effectively disabled).
2. Check `pointTransactionRepository.existsByUserIdAndTransactionType(userId,
   FIRST_LOGIN_BONUS)`. If a bonus transaction already exists, do nothing.
3. Otherwise credit the user with the configured amount through
   `PointAccountService.credit(...)` using transaction type `FIRST_LOGIN_BONUS`
   and a descriptive memo.

Idempotency is enforced by the existence of a prior `FIRST_LOGIN_BONUS`
transaction, not by a boolean flag on the user. This means the award happens at
most once per user even though `awardIfEligible` is invoked on every login.

## Data Model

No new table. The award is recorded as a row in the existing point transaction
ledger with `transaction_type = 'FIRST_LOGIN_BONUS'`. The database `CHECK`
constraint on the transaction type column was extended to include
`FIRST_LOGIN_BONUS`.

## Edge Cases

- Setting value `0`: no bonus, no transaction.
- Repeat logins: skipped because a prior transaction exists.
- Setting changed after a user was already awarded: the user is not re-awarded;
  the existence check still short-circuits.
- Award and login share one transaction, so a failure rolls both back together.

## Testing

Covered by point and auth integration tests that verify the bonus is credited
once, is not duplicated on subsequent logins, and is skipped when the configured
amount is zero.
