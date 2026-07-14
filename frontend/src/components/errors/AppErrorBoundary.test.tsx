import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
