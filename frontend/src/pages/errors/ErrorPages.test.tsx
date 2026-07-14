import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AccessDeniedPage } from "./AccessDeniedPage";
import { NotFoundPage } from "./NotFoundPage";
import { UnexpectedErrorPage } from "./UnexpectedErrorPage";

describe("branded error pages", () => {
  it("gives a lost visitor clear ways back from a missing page", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /this page missed the starting gate/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("404")).toBeVisible();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: /go back/i })).toBeVisible();
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
    ).toBeInTheDocument();
    expect(screen.getByText(/horse owner/i)).toBeVisible();
    expect(screen.getByText("fan@example.com")).toBeVisible();
    expect(screen.getByRole("link", { name: /review role requests/i })).toHaveAttribute(
      "href",
      "/my-role-requests",
    );
    expect(screen.queryByRole("button", { name: /log out|sign out/i })).not.toBeInTheDocument();
  });

  it("lets the visitor retry an unexpected error when recovery is available", () => {
    const onRetry = vi.fn();

    render(
      <MemoryRouter>
        <UnexpectedErrorPage onRetry={onRetry} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: /back home/i })).toHaveAttribute("href", "/");
  });
});
