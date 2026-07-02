# Workflows

## 1. User Onboarding And Role Upgrade

1. Visitor registers an account.
2. Backend creates a pending/verification account and sends an email OTP/token.
3. User verifies email.
4. User logs in and receives access token plus refresh cookie.
5. User completes profile data.
6. User submits one or more personal role requests for owner, jockey, or referee.
7. Admin reviews the request, optionally marks CV as passed, then approves or rejects.
8. Approved roles unlock matching dashboard targets in the profile pill.

Primary source files: `auth/controller/AuthController.java`, `user/controller/UserRoleRequestController.java`, `user/controller/AdminRoleRequestController.java`, `routes/RequireRoleRoute.tsx`, `components/client/ClientHeader.tsx`.

## 2. Organization Onboarding

1. Authenticated user opens organizer registration.
2. Backend rejects the application if the account already has an active personal participation role.
3. User submits organization KYB data.
4. Admin reviews organization applications.
5. Admin approves, rejects, suspends, or reactivates the organization.
6. Approval grants `ORGANIZER` role to the owner account.
7. Organizer dashboard becomes available from the profile pill.

Primary source files: `organization/controller/OrganizationController.java`, `organization/controller/AdminOrganizationController.java`, `organization/service/OrganizationService.java`, `routes/AppRouter.tsx`.

## 3. Organizer Tournament Operations

1. Organizer creates a tournament for the active organization.
2. Organizer submits the tournament for admin launch approval.
3. Admin approves or rejects the submitted tournament.
4. Organizer reviews registrations and jockey applications for owned tournaments.
5. Organizer invites/terminates referee contracts.
6. Organizer locks participants, creates races, assigns contracted referees.
7. Organizer confirms, reopens, or publishes results after referee submission.

Primary source files: `tournament/controller/OrganizerTournamentController.java`, `championship/controller/OrganizerParticipantController.java`, `championship/controller/OrganizerRefereeContractController.java`, `race/controller/OrganizerRaceController.java`.

## 4. Owner Horse And Tournament Registration

1. Owner updates owner profile.
2. Owner creates horse record and uploads image/evidence/document files.
3. Admin reviews horse and approves or rejects it.
4. Owner selects an approved horse and tournament.
5. Backend blocks submission if the same user is already active in the tournament as jockey or referee.
6. Owner submits tournament registration.
7. Registration review approves or rejects the registration.
8. Approved registration becomes eligible for championship contract/participant workflows.

Primary source files: `horse/controller/OwnerHorseController.java`, `horse/controller/AdminHorseController.java`, `tournamentregistration/controller/OwnerTournamentRegistrationController.java`, `tournamentregistration/service/TournamentRegistrationService.java`, `tournament/service/TournamentParticipationGuardService.java`.

## 5. Jockey Championship And Contract

1. Jockey views available championships.
2. Backend blocks application if the same user is already active in the tournament as owner or referee.
3. Jockey applies to a championship pool.
4. Organizer/admin reviews and approves/rejects the pool application.
5. Owner views approved jockey pool.
6. Owner sends a contract invitation for a tournament registration/horse.
7. Jockey accepts or rejects the contract.
8. Organizer/admin locks participants for the championship.

Primary source files: `championship/controller/JockeyPoolApplicationController.java`, `championship/controller/JockeyInvitationContractController.java`, `championship/controller/OrganizerParticipantController.java`, `tournament/service/TournamentParticipationGuardService.java`.

## 6. Referee Contract And Race-Day Operations

1. Organizer lists eligible referees.
2. Backend blocks invite/acceptance if the same user is already active in the tournament as owner or jockey.
3. Organizer sends a referee contract.
4. Referee accepts or declines the contract.
5. Organizer assigns active contracted referee to races.
6. Referee opens assigned races, reviews participants, performs checks, starts/finishes races, drafts and submits results.
7. Organizer confirms/reopens/publishes official results.
8. Result history remains available to referee and organizer/admin views.

Primary source files: `championship/controller/OrganizerRefereeContractController.java`, `championship/controller/RefereeContractController.java`, `referee/controller/RefereeController.java`, `referee/service/RefereeRaceDayService.java`, `race/controller/OrganizerRaceController.java`.

## 7. Wallet, Top-Up, And Withdrawal

1. Authenticated user opens `/wallet`.
2. UI loads wallet summary, transactions, withdrawal requests, and bank accounts.
3. User creates a VNPay top-up; backend creates a signed payment URL.
4. VNPay return/IPN is verified by backend before wallet credit.
5. User creates a withdrawal request with bank information; backend holds the amount immediately.
6. Admin approves/rejects/marks paid. Rejection and user cancellation refund the held amount.

Primary source files: `wallet/controller/WalletController.java`, `wallet/controller/TopUpController.java`, `wallet/controller/WithdrawalController.java`, `wallet/controller/AdminWithdrawalController.java`, `wallet/service/WalletService.java`, `wallet/service/TopUpService.java`, `wallet/service/WithdrawalService.java`.

## 8. Spectator Prediction

1. Spectator opens `/spectator/predictions`.
2. UI loads open races, wallet balance, available markets, and quote data.
3. Spectator submits an `EXACT_POSITION`, `HEAD_TO_HEAD`, or streak wager.
4. Backend validates race availability, market fields, wager limits, and wallet balance.
5. Backend records the prediction and debits wallet with `BET_PLACED`.
6. Backend locks predictions when the race leaves scheduled state.
7. After official results, settlement marks predictions correct/incorrect/refunded and credits wallet payouts/refunds.
8. Admin reviews prediction audit and retries failed settlement jobs if needed.

Primary source files: `prediction/controller/SpectatorPredictionController.java`, `prediction/controller/AdminPredictionController.java`, `prediction/service/PredictionService.java`, `prediction/service/StreakPredictionService.java`, `prediction/scheduler/PredictionSettlementScheduler.java`.

## 9. Blog Publishing

1. Admin creates a blog in `/admin/blog/new`.
2. Admin publishes blog status.
3. Public users read published blogs.
4. Current source does not include a reward claim workflow.

Primary source files: `blog/controller/BlogController.java`, `blog/controller/AdminBlogController.java`, `blog/service/BlogService.java`.
