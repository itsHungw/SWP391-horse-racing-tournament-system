import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders the tournament shell and public home page", () => {
    render(<App />);

    expect(
      screen.getByRole("banner", { name: /horse racing tournament/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent(/race operations/i);
    expect(screen.getByRole("link", { name: /admin/i })).toHaveAttribute(
      "href",
      "/admin",
    );
  });
});
