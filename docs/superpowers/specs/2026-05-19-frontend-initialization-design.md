# Frontend Initialization Design

## Goal

Initialize the `frontend/` workspace as a React, Vite, and TypeScript app that matches the repository technical docs.

## Approach

Use a client-rendered React app with Vite because this project is primarily an authenticated tournament management system backed by Spring Boot APIs. The app will use React Router for role-based page groups, Axios for API calls, and Tailwind CSS for styling.

## Initial Structure

- `src/api/` holds HTTP client setup only.
- `src/components/` holds reusable UI pieces.
- `src/hooks/` holds reusable React hooks.
- `src/layouts/` holds app chrome and navigation.
- `src/pages/` is grouped by user-facing route area.
- `src/routes/` owns route definitions.

## Verification

The initial app should have a Vitest smoke test for the router shell and a Vite production build check.
