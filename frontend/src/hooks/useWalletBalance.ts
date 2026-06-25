import { useSyncExternalStore } from "react";

/**
 * Tiny shared store for the user's wallet balance so every view stays in sync
 * without prop-drilling or a full page reload. The header chip subscribes to it,
 * and any action that changes the balance (wallet refresh, withdraw, cancel)
 * publishes the new value via {@link setWalletBalance}.
 */

type Listener = () => void;

let balance: number | null = null;
const listeners = new Set<Listener>();

function getSnapshot() {
  return balance;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Publish the latest known balance to every subscribed view. No-op if unchanged. */
export function setWalletBalance(value: number | null) {
  if (balance === value) return;
  balance = value;
  for (const listener of listeners) listener();
}

/** Reactive read of the shared wallet balance (re-renders on every publish). */
export function useWalletBalance() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
