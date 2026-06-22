# Workflows

## 1. User Onboarding And Role Upgrade

1. Visitor registers an account.
2. Backend creates a pending/verification account and sends an email OTP/token.
3. User verifies email.
4. User logs in and receives access token plus refresh cookie.
5. User submits a role request for owner, jockey, or referee.
6. Admin reviews the request, optionally marks CV as passed, then approves or rejects.
7. Approved roles unlock matching frontend workspaces.

Primary source files: `auth/controller/AuthController.java`, `user/controller/UserRoleRequestController.java`, `user/controller/AdminRoleRequestController.java`, `routes/RequireRoleRoute.tsx`.

## 2. Owner Horse And Tournament Registration

1. Owner updates owner profile.
2. Owner creates horse record and uploads image/evidence/document files.
3. Admin reviews horse and approves or rejects it.
4. Owner selects an approved horse and tournament.
5. Owner submits tournament registration.
6. Admin approves or rejects the registration.
7. Approved registration becomes eligible for championship contract/participant workflows.

Primary source files: `horse/controller/OwnerHorseController.java`, `horse/controller/AdminHorseController.java`, `tournamentregistration/controller/OwnerTournamentRegistrationController.java`, `tournamentregistration/controller/AdminTournamentRegistrationController.java`.

## 3. Jockey Championship And Contract

1. Jockey views available championships.
2. Jockey applies to a championship pool.
3. Admin reviews and approves/rejects the pool application.
4. Owner views approved jockey pool.
5. Owner sends a contract invitation for a tournament registration/horse.
6. Jockey accepts or rejects the contract.
7. Admin locks participants for the championship.

Primary source files: `championship/controller/JockeyPoolApplicationController.java`, `championship/controller/JockeyInvitationContractController.java`, `championship/controller/AdminChampionshipWorkspaceController.java`.

## 4. Referee Race-Day Operations

1. Referee opens assigned races.
2. Referee reviews race detail and participants.
3. Referee records pre-race checks.
4. Referee starts the race.
5. Referee finishes the race.
6. Referee drafts result entries.
7. Referee submits official result package.
8. Referee records incidents, violations, and reports when needed.
9. Result history remains available to the referee UI.

Primary source files: `referee/controller/RefereeController.java`, `referee/service/RefereeRaceDayService.java`, `frontend/src/pages/referee/race-day`.

## 5. Spectator Prediction

1. Spectator opens `/spectator/predictions`.
2. UI loads open races and point account.
3. Spectator opens prediction options for a race.
4. Spectator submits winner or top-3 prediction.
5. Backend validates race availability, selected participants, point balance, and entry cost.
6. Backend records prediction and point transaction.
7. After official results, settlement marks predictions correct/incorrect/refunded.
8. Admin reviews prediction race audit and retries failed settlement jobs if needed.

Primary source files: `prediction/controller/SpectatorPredictionController.java`, `prediction/controller/AdminPredictionController.java`, `prediction/service/PredictionService.java`, `prediction/scheduler/PredictionSettlementScheduler.java`.

## 6. Blog Reward

1. Admin creates a blog in `/admin/blog/new`.
2. Admin publishes blog status.
3. Public user reads the blog.
4. Authenticated user submits claim reward request with reading/scroll evidence.
5. Backend checks publication state, duplicate claim, daily limit, and reward points setting.
6. Backend records `user_blog_rewards`, updates daily limit, and adds point transaction/account balance.

Primary source files: `blog/controller/BlogController.java`, `blog/controller/AdminBlogController.java`, `blog/service/BlogRewardService.java`, `point/service/PointAccountService.java`.
