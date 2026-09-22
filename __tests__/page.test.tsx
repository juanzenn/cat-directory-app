import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

vi.mock("@/lib/api", () => ({
  getCats: vi.fn().mockResolvedValue({
    current_page: 1,
    data: [
      {
        breed: "Abyssinian",
        country: "Ethiopia",
        origin: "Natural/Standard",
        coat: "Short",
        pattern: "Ticked",
      },
      {
        breed: "Aegean",
        country: "Greece",
        origin: "Natural/Standard",
        coat: "Semi-long",
        pattern: "Multi",
      },
    ],
    per_page: 10,
    total: 2,
    last_page: 1,
    next_page_url: null,
    prev_page_url: null,
  }),
}));

test("Page", async () => {
  render(await Page());

  expect(
    screen.getByRole("heading", { level: 1, name: "Cat Directory" }),
  ).toBeDefined();
  expect(screen.getByText("Abyssinian")).toBeDefined();
  expect(screen.getByText("Aegean")).toBeDefined();
});
