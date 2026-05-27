import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";

vi.mock("./api/authApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api/authApi")>();

  return {
    ...actual,
    logoutRemote: vi.fn().mockResolvedValue(undefined),
  };
});

function createTokenWithRoles(roles: string[], exp = Math.floor(Date.now() / 1000) + 60 * 15) {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ exp, roles })}.signature`;
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("renders the Aqueduct public home page foundation", () => {
    render(<App />);

    expect(
      screen.getByRole("banner", { name: /client site header/i }),
    ).toBeInTheDocument();
    const primaryNav = screen.getByRole("navigation", { name: /primary/i });
    expect(
      screen.getByRole("heading", { name: /aqueduct racetrack/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: /^sign up$/i })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.queryByRole("link", { name: /^dashboard$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^profile$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^logout$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view tournaments/i })).toHaveAttribute(
      "href",
      "#tournaments",
    );
    expect(screen.getAllByRole("link", { name: /^join us/i })[0]).toHaveAttribute(
      "href",
      "/join-us",
    );
    expect(screen.getByText(/live racing in nyc/i)).toBeInTheDocument();
    expect(screen.getByText(/visit aqueduct/i)).toBeInTheDocument();
    expect(screen.getByText(/watch on fox sports/i)).toBeInTheDocument();
    expect(within(primaryNav).getByRole("link", { name: /^tournaments$/i })).toHaveAttribute(
      "href",
      "#tournaments",
    );
    expect(within(primaryNav).getByRole("link", { name: /^races$/i })).toHaveAttribute(
      "href",
      "#races",
    );
    expect(within(primaryNav).getByRole("link", { name: /^predictions$/i })).toHaveAttribute(
      "href",
      "#predictions",
    );
    expect(within(primaryNav).getByRole("link", { name: /^blog$/i })).toHaveAttribute(
      "href",
      "#blog",
    );
    expect(within(primaryNav).getByRole("link", { name: /^leaderboard$/i })).toHaveAttribute(
      "href",
      "#leaderboard",
    );
    expect(
      within(primaryNav).queryByRole("link", { name: /^role request$/i }),
    ).not.toBeInTheDocument();
    expect(within(primaryNav).getByRole("link", { name: /^join us$/i })).toHaveAttribute(
      "href",
      "/join-us",
    );
    expect(
      within(primaryNav).queryByRole("link", { name: /^admin$/i }),
    ).not.toBeInTheDocument();
    expect(
      within(primaryNav).queryByRole("link", { name: /^dashboard$/i }),
    ).not.toBeInTheDocument();
    expect(
      within(primaryNav).queryByRole("link", { name: /^profile$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /latest tournament blog/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /2026 preakness preview/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /follow us/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /sign up for free points/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /create account/i })[0]).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("renders authenticated client header links and logs out", () => {
    localStorage.setItem("accessToken", createTokenWithRoles(["SPECTATOR"]));
    localStorage.setItem("fullName", "Nguyen Van A");
    localStorage.setItem("email", "member@example.com");

    render(<App />);

    const primaryNav = screen.getByRole("navigation", { name: /primary/i });

    expect(screen.getByRole("link", { name: /^dashboard$/i })).toHaveAttribute(
      "href",
      "/spectator/dashboard",
    );
    expect(screen.getByRole("link", { name: /^profile$/i })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("button", { name: /^logout$/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^log in$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^sign up$/i })).not.toBeInTheDocument();
    expect(within(primaryNav).getByRole("link", { name: /^join us$/i })).toHaveAttribute(
      "href",
      "/join-us",
    );
    expect(
      screen.getByRole("heading", { name: /latest tournament blog/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /2026 preakness preview/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /follow us/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /sign up for free points/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /create account/i })[0]).toHaveAttribute(
      "href",
      "/register",
    );

    fireEvent.click(screen.getByRole("button", { name: /^logout$/i }));

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(screen.getByRole("link", { name: /^log in$/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders auth routes without nested main landmarks", () => {
    window.history.pushState({}, "", "/register");

    render(<App />);

    expect(screen.getByRole("heading", { name: /join the circuit/i })).toBeInTheDocument();
    expect(document.querySelectorAll("main")).toHaveLength(1);
  });

  it("renders the Join Us hiring page with application path", () => {
    window.history.pushState({}, "", "/join-us");

    render(<App />);

    expect(screen.getByRole("heading", { name: /we are hiring/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^jockey$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^owner$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^referee$/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /create account/i })[0]).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: /view application flow/i })).toHaveAttribute(
      "href",
      "#application-flow",
    );
  });

  it("redirects unauthenticated admin visitors to login", () => {
    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("redirects unauthenticated profile visitors to login", () => {
    window.history.pushState({}, "", "/profile");

    render(<App />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("redirects unauthenticated role application visitors to login", () => {
    window.history.pushState({}, "", "/my-role-requests");

    render(<App />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("keeps an expired access token session visible so refresh can recover it", () => {
    localStorage.setItem("accessToken", createTokenWithRoles(["SPECTATOR"], 1));
    localStorage.setItem("fullName", "Nguyen Van A");
    localStorage.setItem("email", "member@example.com");

    render(<App />);

    expect(screen.getByRole("link", { name: /^dashboard$/i })).toHaveAttribute(
      "href",
      "/spectator/dashboard",
    );
    expect(localStorage.getItem("accessToken")).not.toBeNull();
  });

  it("routes horse owner dashboard link to the owner workspace", () => {
    localStorage.setItem("accessToken", createTokenWithRoles(["HORSE_OWNER"]));
    localStorage.setItem("fullName", "Owner User");
    localStorage.setItem("email", "owner@example.com");

    render(<App />);

    expect(screen.getByRole("link", { name: /^dashboard$/i })).toHaveAttribute(
      "href",
      "/owner/dashboard",
    );
  });

  it("renders a polished forbidden page for authenticated non-admin users", () => {
    window.history.pushState({}, "", "/admin");
    localStorage.setItem("accessToken", createTokenWithRoles(["SPECTATOR"]));
    localStorage.setItem("fullName", "Nguyen Van A");
    localStorage.setItem("email", "member@example.com");

    render(<App />);

    expect(screen.getByRole("heading", { name: /admin access required/i })).toBeInTheDocument();
    expect(screen.getByText(/your account is signed in/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return home/i })).toHaveAttribute("href", "/");
  });

  it("renders the admin operations foundation route for admin users", () => {
    window.history.pushState({}, "", "/admin");
    localStorage.setItem("accessToken", createTokenWithRoles(["ADMIN"]));
    localStorage.setItem("fullName", "Admin Operator");
    localStorage.setItem("email", "admin@example.com");

    render(<App />);

    expect(
      screen.getByRole("banner", { name: /admin operations header/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /admin workspace/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /admin operations/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", {
        name: /search admin workspace/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /role requests/i }),
    ).toHaveAttribute("href", "/admin/role-requests");
  });

  it("keeps admin user management inside the admin shell", () => {
    window.history.pushState({}, "", "/admin/users");
    localStorage.setItem("accessToken", createTokenWithRoles(["ADMIN"]));
    localStorage.setItem("fullName", "Admin Operator");
    localStorage.setItem("email", "admin@example.com");

    render(<App />);

    expect(
      screen.getByRole("banner", { name: /admin operations header/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /user management/i })).toBeInTheDocument();
    expect(screen.getByText(/manage accounts/i)).toBeInTheDocument();
  });
});
