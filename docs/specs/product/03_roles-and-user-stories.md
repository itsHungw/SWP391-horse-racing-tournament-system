# Roles and User Stories

## 1. Role model

Every registered user receives `SPECTATOR` by default. A user may later request `HORSE_OWNER`, `JOCKEY`, or `REFEREE`. `ADMIN` is provisioned by the system.

## 2. User stories by role

### Guest
- View public tournaments, races, results, rankings, and blogs.
- Register and sign in.

### Spectator
- View public horse and jockey profiles.
- Read blogs and receive eligible virtual-point rewards.
- Submit race predictions before the prediction deadline.
- View prediction history, point history, and notifications.
- Request additional roles.

### Horse Owner
- Create and manage owned horses.
- Submit horses for approval.
- Register approved horses into tournaments.
- Invite jockeys to ride horses in races.
- Confirm participation and view horse results.

### Jockey
- Manage jockey profile.
- Accept or reject invitations.
- View assigned races and personal results.

### Referee
- View assigned races.
- Perform pre-race checks.
- Record violations.
- Submit referee reports.
- Submit race results.

### Admin
- Manage users and role requests.
- Approve horses and tournament registrations.
- Create tournaments and races.
- Assign referees.
- Confirm and publish official results.
- Manage blogs, reward configuration, and system oversight.

## 3. Permission summary

| Capability | Guest | Spectator | Owner | Jockey | Referee | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| View public racing data | Yes | Yes | Yes | Yes | Yes | Yes |
| Submit prediction | No | Yes | Yes | Yes | Yes | Yes |
| Manage own horses | No | No | Yes | No | No | Yes |
| Invite jockey | No | No | Yes | No | No | Yes |
| Accept invitation | No | No | No | Yes | No | No |
| Submit race result | No | No | No | No | Yes | Yes |
| Publish official result | No | No | No | No | No | Yes |

