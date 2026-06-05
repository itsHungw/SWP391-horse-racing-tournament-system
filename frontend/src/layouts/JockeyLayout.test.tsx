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
    const workflow = screen.getByRole("region", { name: /pool workflow/i });
    expect(workflow).toBeInTheDocument();
    expect(within(workflow).getByText(/apply to pool/i)).toBeInTheDocument();
    expect(within(workflow).getByText(/admin review/i)).toBeInTheDocument();
    expect(within(workflow).getByText(/owner contract/i)).toBeInTheDocument();
    expect(within(workflow).getByText(/participant lock/i)).toBeInTheDocument();
    expect(within(workflow).queryByText(/thunder bolt/i)).not.toBeInTheDocument();
    expect(within(workflow).queryByText(/^rank$/i)).not.toBeInTheDocument();
    expect(within(workflow).queryByText(/^points$/i)).not.toBeInTheDocument();
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
