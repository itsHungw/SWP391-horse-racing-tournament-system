import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import App from "./App";

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
    expect(screen.getByRole("link", { name: /request role/i })).toHaveAttribute(
      "href",
      "/my-role-requests",
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
    expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("renders authenticated client header links and logs out", () => {
    localStorage.setItem("accessToken", "test-token");
    localStorage.setItem("fullName", "Nguyen Van A");
    localStorage.setItem("email", "member@example.com");

    render(<App />);

    const primaryNav = screen.getByRole("navigation", { name: /primary/i });

    expect(screen.getByRole("link", { name: /^dashboard$/i })).toHaveAttribute(
      "href",
      "/spectator",
    );
    expect(screen.getByRole("link", { name: /^profile$/i })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("button", { name: /^logout$/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^log in$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^sign up$/i })).not.toBeInTheDocument();
    expect(within(primaryNav).getByRole("link", { name: /^role request$/i })).toHaveAttribute(
      "href",
      "/my-role-requests",
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
    expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute(
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

  it("renders the admin operations foundation route", () => {
    window.history.pushState({}, "", "/admin");

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

  it("keeps future admin sections inside the admin shell", () => {
    window.history.pushState({}, "", "/admin/users");

    render(<App />);

    expect(
      screen.getByRole("banner", { name: /admin operations header/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /users/i })).toBeInTheDocument();
    expect(screen.getByText(/this admin section is reserved/i)).toBeInTheDocument();
  });
});
