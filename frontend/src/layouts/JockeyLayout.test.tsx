import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { JockeyLayout } from "./JockeyLayout";

describe("JockeyLayout", () => {
  it("renders racing cockpit navigation with championship routes", () => {
    render(
      <MemoryRouter>
        <JockeyLayout>
          <h1>Jockey workspace content</h1>
        </JockeyLayout>
      </MemoryRouter>,
    );

    expect(screen.getByRole("banner", { name: /jockey workspace header/i })).toBeInTheDocument();
    expect(screen.getAllByText(/racing cockpit/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: /current assignment/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /career record/i })).not.toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: /jockey workspace/i });
    expect(within(nav).getByRole("link", { name: /^dashboard$/i })).toHaveAttribute("href", "/jockey/dashboard");
    expect(within(nav).getByRole("link", { name: /championships/i })).toHaveAttribute(
      "href",
      "/jockey/championships",
    );
    expect(within(nav).getByRole("link", { name: /contracts/i })).toHaveAttribute("href", "/jockey/contracts");
    expect(within(nav).getByRole("link", { name: /^schedule$/i })).toHaveAttribute("href", "/jockey/schedule");
    expect(within(nav).getByRole("link", { name: /racing passport/i })).toHaveAttribute(
      "href",
      "/jockey/profile",
    );
  });
});
