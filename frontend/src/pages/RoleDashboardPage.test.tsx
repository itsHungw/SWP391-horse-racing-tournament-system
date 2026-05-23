import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoleDashboardPage } from "./RoleDashboardPage";

describe("RoleDashboardPage", () => {
  it("renders non-admin role placeholders", () => {
    render(<RoleDashboardPage role="Spectator" />);

    expect(screen.getByRole("heading", { name: /spectator dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/reserved for the spectator workflow/i)).toBeInTheDocument();
  });
});
