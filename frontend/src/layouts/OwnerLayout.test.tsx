import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { OwnerLayout } from "./OwnerLayout";

describe("OwnerLayout", () => {
  it("renders owner workspace navigation with accessible links", () => {
    render(
      <MemoryRouter>
        <OwnerLayout>
          <h1>Owner dashboard content</h1>
        </OwnerLayout>
      </MemoryRouter>,
    );

    expect(screen.getByRole("banner", { name: /owner workspace header/i })).toBeInTheDocument();
    const ownerNav = screen.getByRole("navigation", { name: /owner workspace/i });
    expect(ownerNav).toBeInTheDocument();
    expect(within(ownerNav).getByRole("link", { name: /^dashboard$/i })).toHaveAttribute(
      "href",
      "/owner/dashboard",
    );
    expect(within(ownerNav).getByRole("link", { name: /my horses/i })).toHaveAttribute("href", "/owner/horses");
    expect(within(ownerNav).getByRole("link", { name: /tournament registrations/i })).toHaveAttribute(
      "href",
      "/owner/registrations",
    );
    expect(within(ownerNav).getByRole("link", { name: /profile/i })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("heading", { name: /owner dashboard content/i })).toBeInTheDocument();
  });
});
