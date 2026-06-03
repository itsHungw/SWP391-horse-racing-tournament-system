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
    expect(within(list).getByRole("button", { name: /river gate stable/i })).toBeInTheDocument();
    expect(within(list).getByRole("button", { name: /northwind stable/i })).toBeInTheDocument();

    const detail = screen.getByRole("region", { name: /contract detail/i });
    expect(within(detail).getByRole("heading", { name: /contract detail/i })).toBeInTheDocument();
    expect(within(detail).getByText(/river-gate-summer-terms\.pdf/i)).toBeInTheDocument();

    fireEvent.click(within(list).getByRole("button", { name: /river gate stable/i }));
    expect(within(detail).getAllByText(/black storm/i).length).toBeGreaterThan(0);
    expect(within(detail).getByText(/you already committed to another horse/i)).toBeInTheDocument();
    expect(within(detail).getByRole("button", { name: /accept contract/i })).toBeDisabled();

    fireEvent.click(within(list).getByRole("button", { name: /northwind stable/i }));
    fireEvent.click(within(detail).getByRole("button", { name: /accept contract/i }));
    expect(within(detail).getAllByText(/^committed$/i).length).toBeGreaterThan(0);
  });

  it("supports inbox filters, unread state, search, due status, and agreement preview", () => {
    render(
      <MemoryRouter>
        <JockeyContractsPage />
      </MemoryRouter>,
    );

    const tabs = screen.getByRole("tablist", { name: /contract filters/i });
    expect(within(tabs).getByRole("tab", { name: /pending 2/i })).toHaveAttribute("aria-selected", "true");

    const list = screen.getByRole("list", { name: /contract list/i });
    const riverGate = within(list).getByRole("button", { name: /river gate stable/i });
    expect(within(riverGate).getByText(/unread contract/i)).toBeInTheDocument();
    expect(within(riverGate).getByText(/overdue/i)).toBeInTheDocument();
    expect(within(riverGate).getByText(/last updated 2h ago/i)).toBeInTheDocument();

    fireEvent.click(riverGate);
    expect(within(riverGate).queryByText(/unread contract/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search stable, horse, championship/i), {
      target: { value: "Northwind" },
    });
    expect(within(list).getByRole("button", { name: /northwind stable/i })).toBeInTheDocument();
    expect(within(list).queryByRole("button", { name: /river gate stable/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search stable, horse, championship/i), {
      target: { value: "" },
    });
    fireEvent.click(within(tabs).getByRole("tab", { name: /committed 1/i }));
    expect(within(list).getByRole("button", { name: /sunrise stable/i })).toBeInTheDocument();

    const detail = screen.getByRole("region", { name: /contract detail/i });
    expect(within(detail).getByText(/assignment agreement/i)).toBeInTheDocument();
    expect(within(detail).getByText(/uploaded by sunrise stable/i)).toBeInTheDocument();
    expect(within(detail).getByRole("button", { name: /preview pdf/i })).toBeInTheDocument();

    fireEvent.click(within(detail).getByRole("button", { name: /preview pdf/i }));
    expect(within(detail).getByRole("region", { name: /pdf preview/i })).toBeInTheDocument();
  });
});
