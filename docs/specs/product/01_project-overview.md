# Project Overview

## 1. Purpose

The system digitizes the full lifecycle of a horse racing tournament:

- account registration,
- role approval,
- horse approval,
- tournament and race administration,
- jockey invitations,
- referee operations,
- official result publication,
- rankings and notifications.

On top of that core, the system adds a **clean prediction game** for spectators. Users can earn virtual points by reading published blogs and use a fixed number of points to join prediction challenges for upcoming races.

## 2. Product layers

### 2.1 Core racing management

This is the primary product:

- organize tournaments,
- manage approved horses and participants,
- assign referees,
- record violations,
- confirm and publish official results.

### 2.2 Engagement layer

This is secondary:

- reward blog reading,
- let spectators submit race predictions,
- award fixed game points for correct predictions,
- maintain rankings and notifications.

## 3. Main actors

| Actor | Main responsibility |
| --- | --- |
| Guest | Browse public tournaments, races, results, rankings, blogs |
| Spectator | Predict races, read blogs, manage profile, request extra roles |
| Horse Owner | Manage horses, register horses, invite jockeys |
| Jockey | Accept invitations, view races and results |
| Referee | Perform pre-race checks, record violations, submit results |
| Admin | Govern users, approvals, tournaments, races, and official publication |

## 4. Product identity

This project is **not** a wagering platform. It is a tournament management system with game-like engagement features.

## 5. AI position

The project includes one lightweight AI feature: **AI Race Insight**. It helps spectators understand race context before making a prediction by highlighting notable participants and explaining simple factors such as recent form, jockey success, distance fit, and track condition fit.

