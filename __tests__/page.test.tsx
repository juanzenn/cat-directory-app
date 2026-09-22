import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Page from "../app/page";
import CatList from "../components/cat-list";
import { getCats } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getCats: vi.fn(),
}));

const mockGetCats = vi.mocked(getCats);

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

const page1 = {
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
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  mockGetCats.mockReset();
});

afterEach(() => {
  cleanup();
});

test("Page shows SSR-prefetched cats", async () => {
  mockGetCats.mockResolvedValue(page1);

  renderWithProviders(await Page());

  expect(
    screen.getByRole("heading", { level: 1, name: "Cat Directory" }),
  ).toBeDefined();

  await waitFor(() => {
    expect(screen.getByText("Abyssinian")).toBeDefined();
    expect(screen.getByText("Aegean")).toBeDefined();
  });
});

test("CatList shows pending status", () => {
  mockGetCats.mockImplementation(() => new Promise(() => {}));

  renderWithProviders(<CatList />);

  expect(screen.getByText("Loading...")).toBeDefined();
});

test("CatList shows error status", async () => {
  mockGetCats.mockRejectedValue(new Error("Network down"));

  renderWithProviders(<CatList />);

  await waitFor(() => {
    expect(screen.getByText("Error: Network down")).toBeDefined();
  });
});

test("CatList shows success status with cats", async () => {
  mockGetCats.mockResolvedValue(page1);

  renderWithProviders(<CatList />);

  await waitFor(() => {
    expect(screen.getByText("Abyssinian")).toBeDefined();
    expect(screen.getByText("Aegean")).toBeDefined();
  });
});
