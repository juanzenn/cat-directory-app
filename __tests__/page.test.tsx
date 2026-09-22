import { expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
  act,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Page from "../app/page";
import CatList from "../components/cat-list";
import { getCats } from "@/lib/api";
import type { Breed, Paginated } from "@/lib/api";
import { getQueryClient } from "@/lib/query/get-query-client";

vi.mock("@/lib/api", () => ({
  getCats: vi.fn(),
}));

const mockGetCats = vi.mocked(getCats);

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal("ResizeObserver", MockResizeObserver);

function makePage(
  currentPage: number,
  lastPage: number,
  breeds: Breed[],
): Paginated<Breed> {
  return {
    current_page: currentPage,
    data: breeds,
    per_page: 10,
    total: breeds.length,
    last_page: lastPage,
    next_page_url: currentPage < lastPage ? `?page=${currentPage + 1}` : null,
    prev_page_url: currentPage > 1 ? `?page=${currentPage - 1}` : null,
  };
}

const page1 = makePage(1, 1, [
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
]);

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
  getQueryClient().clear();

  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      return 600;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      return 800;
    },
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("Page shows SSR-prefetched cats", async () => {
  mockGetCats.mockResolvedValue(page1);

  renderWithProviders(
    await Page({ searchParams: Promise.resolve({}) }),
  );

  expect(
    screen.getByRole("heading", { level: 1, name: "Cat Directory" }),
  ).toBeDefined();

  await waitFor(() => {
    expect(screen.getByText("Abyssinian")).toBeDefined();
    expect(screen.getByText("Aegean")).toBeDefined();
  });
});

test("Page prefetches pages 1 through N for ?page=N", async () => {
  mockGetCats.mockImplementation(async (params) => {
    const page = params?.page ?? 1;
    return makePage(page, 3, [
      {
        breed: `Breed ${page}`,
        country: "Testland",
        origin: "Natural/Standard",
        coat: "Short",
        pattern: "Solid",
      },
    ]);
  });

  const jsx = await Page({ searchParams: Promise.resolve({ page: "3" }) });

  expect(mockGetCats).toHaveBeenCalledTimes(3);
  expect(mockGetCats).toHaveBeenCalledWith({ page: 1, limit: 10 });
  expect(mockGetCats).toHaveBeenCalledWith({ page: 2, limit: 10 });
  expect(mockGetCats).toHaveBeenCalledWith({ page: 3, limit: 10 });

  renderWithProviders(jsx);

  await waitFor(() => {
    expect(screen.getByText("Breed 1")).toBeDefined();
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

test("Page with ?q does not pass search to getCats", async () => {
  mockGetCats.mockResolvedValue(page1);

  const jsx = await Page({
    searchParams: Promise.resolve({ q: "Abys", page: "1" }),
  });

  expect(mockGetCats).toHaveBeenCalledWith({ page: 1, limit: 10 });
  for (const call of mockGetCats.mock.calls) {
    expect(call[0]).not.toHaveProperty("q");
    expect(call[0]).not.toHaveProperty("search");
  }

  renderWithProviders(jsx);

  await waitFor(() => {
    expect(screen.getByDisplayValue("Abys")).toBeDefined();
    expect(screen.getByText("Abyssinian")).toBeDefined();
    expect(screen.queryByText("Aegean")).toBeNull();
  });
});

test("CatList filters locally and syncs q to the URL", async () => {
  mockGetCats.mockResolvedValue(page1);
  window.history.replaceState({}, "", "/");

  renderWithProviders(<CatList />);

  await waitFor(() => {
    expect(screen.getByText("Abyssinian")).toBeDefined();
    expect(screen.getByText("Aegean")).toBeDefined();
  });

  vi.useFakeTimers();

  const input = screen.getByRole("searchbox");
  fireEvent.change(input, { target: { value: "greece" } });

  expect(screen.getByDisplayValue("greece")).toBeDefined();
  expect(screen.getByText("Abyssinian")).toBeDefined();
  expect(screen.getByText("Aegean")).toBeDefined();
  expect(new URL(window.location.href).searchParams.get("q")).toBeNull();

  await act(async () => {
    vi.advanceTimersByTime(300);
  });

  expect(screen.queryByText("Abyssinian")).toBeNull();
  expect(screen.getByText("Aegean")).toBeDefined();
  expect(new URL(window.location.href).searchParams.get("q")).toBe("greece");

  vi.useRealTimers();
});

test("CatList with initialQuery shows only matching cats", async () => {
  mockGetCats.mockResolvedValue(page1);

  renderWithProviders(<CatList initialQuery="Aby" />);

  await waitFor(() => {
    expect(screen.getByDisplayValue("Aby")).toBeDefined();
    expect(screen.getByText("Abyssinian")).toBeDefined();
  });

  expect(screen.queryByText("Aegean")).toBeNull();
});

test("CatList Refresh button refetches from page 1 and clears page param", async () => {
  mockGetCats.mockResolvedValue(page1);
  window.history.replaceState({}, "", "/?page=2&q=Aby");

  renderWithProviders(<CatList initialQuery="Aby" />);

  await waitFor(() => {
    expect(screen.getByText("Abyssinian")).toBeDefined();
  });

  const callsBefore = mockGetCats.mock.calls.length;

  fireEvent.click(
    screen.getByRole("button", { name: "Refresh", hidden: true }),
  );

  await waitFor(() => {
    expect(mockGetCats.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(mockGetCats).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(new URL(window.location.href).searchParams.get("page")).toBeNull();
    expect(new URL(window.location.href).searchParams.get("q")).toBe("Aby");
  });

  expect(screen.getByText("Abyssinian")).toBeDefined();
  expect(screen.queryByText("Aegean")).toBeNull();
});
