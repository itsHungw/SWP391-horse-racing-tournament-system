import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationBell } from "./NotificationBell";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notificationApi";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../api/notificationApi", () => ({
  getUnreadNotificationCount: vi.fn(),
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

describe("NotificationBell Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUnreadNotificationCount).mockResolvedValue(2);
    vi.mocked(getNotifications).mockResolvedValue([
      {
        id: 101,
        type: "ROLE_APPROVED",
        title: "Role request approved",
        body: "Your request to become a HORSE_OWNER was approved.",
        referenceType: "ROLE_REQUEST",
        referenceId: 1,
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 102,
        type: "HORSE_REJECTED",
        title: "Horse profile rejected",
        body: "Your horse Nova was rejected: Missing health certificate",
        referenceType: "HORSE",
        referenceId: 2,
        read: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    vi.mocked(markNotificationRead).mockResolvedValue(undefined);
    vi.mocked(markAllNotificationsRead).mockResolvedValue(undefined);
  });

  it("renders the notification bell button and badge count", async () => {
    render(
      <MemoryRouter>
        <NotificationBell theme="organizer" />
      </MemoryRouter>,
    );

    const button = await screen.findByRole("button", { name: /notifications/i });
    expect(button).toBeInTheDocument();
    
    // Expect unread count badge to show "2"
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("opens the dropdown on click and displays items", async () => {
    render(
      <MemoryRouter>
        <NotificationBell theme="organizer" />
      </MemoryRouter>,
    );

    const button = await screen.findByRole("button", { name: /notifications/i });
    fireEvent.click(button);

    // Verify loading and display of notifications
    expect(await screen.findByText("Role request approved")).toBeInTheDocument();
    expect(screen.getByText("Horse profile rejected")).toBeInTheDocument();
  });

  it("marks as read and navigates to correct route when a notification is clicked", async () => {
    render(
      <MemoryRouter>
        <NotificationBell theme="organizer" />
      </MemoryRouter>,
    );

    const button = await screen.findByRole("button", { name: /notifications/i });
    fireEvent.click(button);

    // Click the unread "Role request approved" notification
    const itemButton = await screen.findByRole("button", { name: /role request approved/i });
    fireEvent.click(itemButton);

    // Should call API to mark it as read
    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith(101);
    });

    // Should navigate to owner dashboard (ROLE_APPROVED for HORSE_OWNER)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/owner/dashboard");
    });
  });
});
