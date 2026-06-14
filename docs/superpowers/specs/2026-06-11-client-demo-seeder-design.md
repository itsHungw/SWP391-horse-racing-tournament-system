# Client Demo Seeder Design

## Purpose

Extend the dev-only demo data so the public and spectator client journeys have
useful data immediately after a fresh local boot.

## Scope

`DevDemoSeeder` remains restricted to the `dev` Spring profile. It will seed:

- demo owner, jockey, and spectator accounts;
- approved horses, championships, races, participants, and one published result;
- tournament registrations and participants for the ongoing championship;
- pending predictions for scheduled races so community choices are visible;
- settled predictions for the published race so prediction history and the
  spectator leaderboard are populated;
- point accounts whose balances match the final demo state.

Production migrations and production data remain unchanged.

## Idempotency

The seeder will no longer skip everything merely because any tournament exists.
Each demo record is found by a stable natural key, such as email, role name,
registration code, tournament code, or race code, and is inserted only when
missing. Re-running the seeder must not duplicate records or reset existing demo
point balances.

## Verification

An H2 integration test will prepare the reference roles and local admin, run the
seeder twice, and verify:

- the expected demo entities exist;
- scheduled races expose active participants and pending predictions;
- the published race has results and settled predictions;
- the second run leaves row counts and spectator balances unchanged.

The seeder will also be smoke-tested against the local SQL Server database.
