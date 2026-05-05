# Mobile Implementation Placeholder

This repo is the React + Vite **web app**. A future React Native mobile app will share the `src/lib/` and `src/hooks/` business logic layers.

## What to build
- React Native app using Expo Router
- Import `src/lib/` and `src/hooks/` as a shared package
- Implement screens: Login, Dashboard, Transactions, Budget, Goals, Monthly, Accounts
- Bottom tab navigation (DockNav stub in `src/components/layout/DockNav.tsx`)
- Adapt AddTransactionModal → React Native modal

## Screens marked TODO (logic preserved, no screen yet)
- **Planning** — spend type allocation (`SpendType` + `SpendTypeMap` in `useFinance` state, `lib/data.ts`)
- **Recurring transactions** — rules run automatically via `lib/recurring.ts`; accessible via AddTransactionModal
