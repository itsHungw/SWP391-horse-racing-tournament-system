import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClientSession } from "../hooks/useClientSession";

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

export interface NotificationBellProps {
  theme?: "client" | "admin" | "organizer" | "owner" | "referee" | "jockey";
}

/**
 * Header notification bell — unread badge (polled), dropdown feed, click-to-read and mark-all-read.
 * Shows the signed-in user's notifications (GET /api/v1/notifications).
 */
export function NotificationBell({ theme = "organizer" }: NotificationBellProps) {
  const navigate = useNavigate();
  const { session } = useClientSession();
  const userRoles = (session?.roles || []).map((r) => r.trim().toUpperCase());
  const isOrganizer = userRoles.includes("ORGANIZER");
  const isAdmin = userRoles.includes("ADMIN");
  const isReferee = userRoles.includes("REFEREE");
  const isOwner = userRoles.includes("HORSE_OWNER");
  const isJockey = userRoles.includes("JOCKEY");

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      void loadNotifications();
    }
  }, [open]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        setUnread(count);
      } catch {
        // Ignored
      }
    };
    void fetchCount();
    interval = setInterval(() => {
      void fetchCount();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const handleItem = async (n: AppNotification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      await markNotificationRead(n.id).catch(() => undefined);
    }
    setOpen(false);

    if (n.referenceType && n.referenceId) {
      const refId = n.referenceId;
      switch (n.referenceType) {
        case "ROLE_REQUEST":
          if (n.type === "ROLE_APPROVED") {
            const textLower = ((n.title || "") + " " + (n.body || "")).toLowerCase();
            if (textLower.includes("owner")) navigate("/owner/dashboard");
            else if (textLower.includes("organizer")) navigate("/organizer");
            else if (textLower.includes("referee")) navigate("/referee/dashboard");
            else if (textLower.includes("jockey")) navigate("/jockey/dashboard");
            else navigate("/profile");
          } else {
            navigate("/profile");
          }
          break;
        case "HORSE":
          navigate("/owner/horses");
          break;
        case "WITHDRAWAL":
        case "TOPUP_ORDER":
          navigate("/wallet");
          break;
        case "TOURNAMENT":
          if (isOrganizer) {
            if (n.type === "CONTRACT_ACCEPTED" || n.type === "CONTRACT_DECLINED") {
              navigate(`/organizer/tournaments/${refId}?tab=rounds`);
            } else {
              navigate(`/organizer/tournaments/${refId}`);
            }
          } else if (isAdmin) {
            navigate(`/admin/tournaments/${refId}`);
          } else if (isReferee) {
            navigate("/referee/contracts");
          } else if (isJockey) {
            navigate("/jockey/championships");
          } else {
            navigate(`/championships/${refId}`);
          }
          break;
        case "REGISTRATION":
        case "TOURNAMENT_REGISTRATION":
          if (isOwner) {
            navigate(`/owner/registrations?registrationId=${refId}`);
          } else if (isOrganizer) {
            navigate(`/organizer/tournaments/${refId}?tab=applications`);
          } else {
            navigate(`/owner/registrations?registrationId=${refId}`);
          }
          break;
        case "REFEREE_CONTRACT":
          if (isReferee) {
            navigate("/referee/contracts");
          } else if (isOrganizer) {
            navigate(`/organizer/tournaments/${refId}?tab=rounds`);
          } else {
            navigate("/organizer");
          }
          break;
        case "JOCKEY_POOL_APPLICATION":
          if (isJockey) {
            navigate("/jockey/championships");
          } else {
            navigate("/jockey/dashboard");
          }
          break;
        case "RACE":
          if (isReferee) navigate(`/referee/races/${refId}/results`);
          else navigate(`/races/${refId}`);
          break;
        default:
          break;
      }
    }
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await markAllNotificationsRead().catch(() => undefined);
  };

  // Button styles mapping
  let btnClasses = "relative inline-flex h-11 w-11 items-center justify-center rounded-lg border transition sm:h-12 sm:w-12 ";
  if (theme === "client") {
    btnClasses += "border-white/10 bg-white/5 text-ivory-dim hover:bg-white/10 hover:text-ivory focus-visible:outline-gold-400";
  } else if (theme === "admin") {
    btnClasses += "border-[#d8d8d8] bg-white text-slate-600 hover:border-[#b3193a] hover:text-[#161616] focus-visible:outline-[#b3193a]";
  } else if (theme === "owner") {
    btnClasses += "border-slate-200 bg-white text-slate-600 hover:border-[#006d5b] hover:text-slate-950 focus-visible:outline-[#006d5b]";
  } else if (theme === "referee") {
    btnClasses += "border-slate-200 bg-white text-slate-600 hover:border-blue-600 hover:text-slate-950 focus-visible:outline-blue-600";
  } else if (theme === "jockey") {
    btnClasses += "border-slate-200 bg-white text-slate-600 hover:border-indigo-600 hover:text-slate-950 focus-visible:outline-indigo-600";
  } else {
    // Default organizer
    btnClasses += "border-[#e7e0d3] bg-white text-[#6f665b] hover:border-[#bb8a3c] hover:text-[#211d1a] focus-visible:outline-[#bb8a3c]";
  }

  // Badge styles mapping
  let badgeClasses = "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black bg-red-600 text-white shadow-sm ring-2 ";
  if (theme === "client") {
    badgeClasses += "ring-turf-950";
  } else {
    badgeClasses += "ring-white";
  }

  // Dropdown Container styles mapping
  let dropdownClasses = "absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border ";
  if (theme === "client") {
    dropdownClasses += "bg-turf-900/95 border-white/10 text-ivory backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)]";
  } else {
    dropdownClasses += "bg-white border-[#e7e0d3] text-[#211d1a] shadow-[0_20px_60px_rgba(28,24,22,0.22)]";
  }

  // Header border & Mark All read button styles mapping
  let headerBorderClass = "flex items-center justify-between border-b px-4 py-3 ";
  let headerTextClass = "font-display text-base font-medium ";
  let markAllBtnClass = "inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide transition ";
  if (theme === "client") {
    headerBorderClass += "border-white/10";
    headerTextClass += "text-ivory";
    markAllBtnClass += "text-gold-300 hover:text-gold-200";
  } else {
    headerBorderClass += "border-[#efe9dd]";
    headerTextClass += "text-[#211d1a]";
    markAllBtnClass += "text-[#8a6a1c] hover:text-[#bb8a3c]";
  }

  // Divider and Empty state mapping
  let divideClass = "divide-y ";
  let emptyStateClass = "px-4 py-10 text-center text-sm ";
  if (theme === "client") {
    divideClass += "divide-white/10";
    emptyStateClass += "text-ivory-faint";
  } else {
    divideClass += "divide-[#efe9dd]";
    emptyStateClass += "text-[#8a8276]";
  }

  const scrollStyle = {
    "--scrollbar-thumb": theme === "client" ? "#135041" : "#cbd5e1",
    "--scrollbar-thumb-hover": theme === "client" ? "#d4af37" : "#94a3b8",
  } as React.CSSProperties;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        className={btnClasses}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className={badgeClasses}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
 
      {open && (
        <div className={dropdownClasses}>
          <div className={headerBorderClass}>
            <p className={headerTextClass}>Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className={markAllBtnClass}
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
 
          <div className="max-h-[22rem] overflow-y-auto notification-scrollbar" style={scrollStyle}>
            {loading ? (
              <div className="space-y-2 p-4">
                <div className={`h-12 animate-pulse rounded-lg ${theme === "client" ? "bg-white/5" : "bg-[#faf7f0]"}`} />
                <div className={`h-12 animate-pulse rounded-lg ${theme === "client" ? "bg-white/5" : "bg-[#faf7f0]"}`} />
              </div>
            ) : items.length === 0 ? (
              <p className={emptyStateClass}>You’re all caught up.</p>
            ) : (
              <ul className={divideClass}>
                {items.map((n) => {
                  let liBtnClass = "flex w-full items-start gap-3 px-4 py-3 text-left transition ";
                  let dotClass = "mt-1.5 h-2 w-2 shrink-0 rounded-full ";
                  let titleClass = "truncate text-sm ";
                  let timeClass = "shrink-0 text-[10px] font-bold uppercase tracking-wide ";
                  let bodyClass = "mt-0.5 block text-xs leading-relaxed ";

                  if (theme === "client") {
                    liBtnClass += "hover:bg-white/5 " + (n.read ? "bg-transparent" : "bg-white/[0.03]");
                    dotClass += n.read ? "bg-transparent" : "bg-red-600";
                    titleClass += n.read ? "font-semibold text-ivory-dim" : "font-black text-ivory";
                    timeClass += "text-ivory-faint";
                    bodyClass += "text-ivory-faint";
                  } else {
                    liBtnClass += "hover:bg-[#faf7f0] " + (n.read ? "bg-transparent" : "bg-[#fbf8f1]");
                    dotClass += n.read ? "bg-transparent" : "bg-red-600";
                    titleClass += n.read ? "font-semibold text-[#3a342d]" : "font-black text-[#211d1a]";
                    timeClass += "text-[#a99f8c]";
                    bodyClass += "text-[#6f665b]";
                  }

                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleItem(n)}
                        className={liBtnClass}
                      >
                        <span className={dotClass} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={titleClass}>
                              {n.title}
                            </span>
                            <span className={timeClass}>{timeAgo(n.createdAt)}</span>
                          </span>
                          {n.body && <span className={bodyClass}>{n.body}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
