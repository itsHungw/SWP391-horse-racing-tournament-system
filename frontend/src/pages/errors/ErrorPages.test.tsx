import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AccessDeniedPage } from "./AccessDeniedPage";
import { NotFoundPage } from "./NotFoundPage";
import { UnexpectedErrorPage } from "./UnexpectedErrorPage";

function LocationProbe() {
  const location = useLocation();

  return <output aria-label="Current route">{location.pathname}</output>;
}

describe("branded error pages", () => {
  it("focuses the missing-page heading and returns to the previous route", async () => {
    render(
      <MemoryRouter initialEntries={["/previous-route", "/missing"]} initialIndex={1}>
        <NotFoundPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    const heading = screen.getByRole("heading", {
      name: /this page missed the starting gate/i,
    });

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(heading).toHaveFocus();
    expect(screen.getByText("404")).toBeVisible();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    expect(screen.getByLabelText(/current route/i)).toHaveTextContent("/missing");

    fireEvent.click(screen.getByRole("button", { name: /go back/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/current route/i)).toHaveTextContent("/previous-route");
    });
  });

  it("explains the access gate without asking the visitor to sign out", () => {
    render(
      <MemoryRouter>
        <AccessDeniedPage
          email="fan@example.com"
          requiredRole="HORSE_OWNER"
          workspaceName="Owner Workspace"
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /access beyond this gate is restricted/i }),
    ).toHaveFocus();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText(/horse owner/i)).toBeVisible();
    expect(screen.getByText("fan@example.com")).toBeVisible();
    expect(screen.getByRole("link", { name: /review role requests/i })).toHaveAttribute(
      "href",
      "/my-role-requests",
    );
    expect(screen.queryByRole("button", { name: /log out|sign out/i })).not.toBeInTheDocument();
  });

  it("uses a labelled section instead of another main landmark when embedded", () => {
    render(
      <MemoryRouter>
        <main>
          <AccessDeniedPage embedded requiredRole="ADMIN" workspaceName="Admin Operations" />
        </main>
      </MemoryRouter>,
    );

    const heading = screen.getByRole("heading", {
      name: /access beyond this gate is restricted/i,
    });

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("region", { name: heading.textContent ?? "" })).toBeInTheDocument();
  });

  it("lets the visitor retry an unexpected error when recovery is available", () => {
    const onRetry = vi.fn();
    const onBackHome = vi.fn();

    render(
      <MemoryRouter>
        <UnexpectedErrorPage onBackHome={onBackHome} onRetry={onRetry} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /race control hit an unexpected obstacle/i }),
    ).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledOnce();
    const backHomeLink = screen.getByRole("link", { name: /back home/i });

    expect(backHomeLink).toHaveAttribute("href", "/");

    fireEvent.click(backHomeLink);

    expect(onBackHome).toHaveBeenCalledOnce();
  });
});
