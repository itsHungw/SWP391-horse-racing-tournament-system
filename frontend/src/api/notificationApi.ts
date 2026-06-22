import { httpClient } from "./httpClient";

export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  referenceType?: string | null;
  referenceId?: number | null;
  read: boolean;
  createdAt: string;
};

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await httpClient.get<AppNotification[]>("/notifications");
  return res.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await httpClient.get<{ count: number }>("/notifications/unread-count");
  return res.data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await httpClient.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await httpClient.post("/notifications/read-all");
}
