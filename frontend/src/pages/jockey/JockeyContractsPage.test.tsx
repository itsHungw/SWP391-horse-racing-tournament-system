import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { JockeyContractsPage } from "./JockeyContractsPage";

describe("JockeyContractsPage", () => {
  it("uses compact contract list with a detail panel for decisions", () => {
    render(
      <MemoryRouter>
        <JockeyContractsPage />
      </MemoryRouter>,
    );

    const list = screen.getByRole("list", { name: /contract list/i });
    expect(within(list).getByRole("button", { name: /sunrise stable/i })).toBeInTheDocument();
    expect(within(list).getByRole("button", { name: /river gate stable/i })).toBeInTheDocument();

    const detail = screen.getByRole("region", { name: /contract detail/i });
    expect(within(detail).getByRole("heading", { name: /contract detail/i })).toBeInTheDocument();
    expect(within(detail).getByText(/summer-assignment-agreement\.pdf/i)).toBeInTheDocument();

    fireEvent.click(within(list).getByRole("button", { name: /river gate stable/i }));
    expect(within(detail).getAllByText(/black storm/i).length).toBeGreaterThan(0);
    expect(within(detail).getByText(/you already committed to another horse/i)).toBeInTheDocument();
    expect(within(detail).getByRole("button", { name: /accept contract/i })).toBeDisabled();

    fireEvent.click(within(list).getByRole("button", { name: /northwind stable/i }));
    fireEvent.click(within(detail).getByRole("button", { name: /accept contract/i }));
    expect(within(detail).getByText(/^committed$/i)).toBeInTheDocument();
  });
});
