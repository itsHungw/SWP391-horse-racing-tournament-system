import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { expect, it, vi } from "vitest";

import { AppErrorBoundary } from "./AppErrorBoundary";

type ThrowingChildProps = {
  shouldThrow: boolean;
};

function ThrowingChild({ shouldThrow }: ThrowingChildProps) {
  if (shouldThrow) {
    throw new Error("Test render failure");
  }

  return <p>Recovered content</p>;
}

function RouteAwareChild() {
  const location = useLocation();

  if (location.pathname !== "/") {
    throw new Error("Test route failure");
  }

  return <p>Home content</p>;
}

function LocationProbe() {
  const location = useLocation();

  return <output aria-label="Current route">{location.pathname}</output>;
}

it("shows the unexpected-error fallback and recovers after retry", () => {
  const originalConsoleError = console.error;
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    const { rerender } = render(
      <MemoryRouter>
        <AppErrorBoundary>
          <ThrowingChild shouldThrow />
        </AppErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /unexpected obstacle/i })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(
      "Uncaught application error",
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );

    rerender(
      <MemoryRouter>
        <AppErrorBoundary>
          <ThrowingChild shouldThrow={false} />
        </AppErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Recovered content")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(screen.getByText("Recovered content")).toBeVisible();
  } finally {
    consoleError.mockRestore();
  }

  expect(console.error).toBe(originalConsoleError);
});

it("resets the fallback when navigating home from a failed route", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

  try {
    render(
      <MemoryRouter initialEntries={["/failed-route"]}>
        <AppErrorBoundary>
          <Routes>
            <Route path="*" element={<RouteAwareChild />} />
          </Routes>
        </AppErrorBoundary>
        <LocationProbe />
      </MemoryRouter>,
      { onRecoverableError: () => undefined },
    );

    expect(screen.getByRole("heading", { name: /unexpected obstacle/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /back home/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/current route/i)).toHaveTextContent("/");
      expect(screen.getByText("Home content")).toBeVisible();
    });
  } finally {
    consoleError.mockRestore();
  }
});
