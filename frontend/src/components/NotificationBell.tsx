import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

import {
  type AppNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationApi";

function timeAgo(value: string) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(value).toLocaleDateString();
}

/**
 * Header notification bell — unread badge (polled), dropdown feed, click-to-read and mark-all-read.
 * Shows the signed-in user's notifications (GET /api/v1/notifications).
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      getUnreadNotificationCount()
        .then((c) => active && setUnread(c))
        .catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getNotifications()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleItem = async (n: AppNotification) => {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    await markNotificationRead(n.id).catch(() => undefined);
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await markAllNotificationsRead().catch(() => undefined);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#e7e0d3] bg-white text-[#6f665b] transition hover:border-[#bb8a3c] hover:text-[#211d1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bb8a3c] sm:h-12 sm:w-12"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-[#e7e0d3] bg-white shadow-[0_20px_60px_rgba(28,24,22,0.22)]">
          <div className="flex items-center justify-between border-b border-[#efe9dd] px-4 py-3">
            <p className="font-display text-base font-medium text-[#211d1a]">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide text-[#8a6a1c] transition hover:text-[#bb8a3c]"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                <div className="h-12 animate-pulse rounded-lg bg-[#faf7f0]" />
                <div className="h-12 animate-pulse rounded-lg bg-[#faf7f0]" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[#8a8276]">You’re all caught up.</p>
            ) : (
              <ul className="divide-y divide-[#efe9dd]">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleItem(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#faf7f0] ${
                        n.read ? "" : "bg-[#fbf8f1]"
                      }`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-[#bb8a3c]"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={`truncate text-sm ${n.read ? "font-semibold text-[#3a342d]" : "font-black text-[#211d1a]"}`}>
                            {n.title}
                          </span>
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#a99f8c]">{timeAgo(n.createdAt)}</span>
                        </span>
                        {n.body && <span className="mt-0.5 block text-xs leading-relaxed text-[#6f665b]">{n.body}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
