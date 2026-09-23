import { expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BreedDetailPage from "../app/breeds/[slug]/page";
import CatDetail from "../components/cat-detail";
import { getCatFact, getCats } from "@/lib/api";
import type { Breed, CatFact, Paginated } from "@/lib/api";
import { getQueryClient } from "@/lib/query/get-query-client";

vi.mock("@/lib/api", () => ({
  getCats: vi.fn(),
  getCatFact: vi.fn(),
}));

const mockNotFound = vi.fn(() => null);
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
  useSearchParams: () => mockSearchParams,
}));

const mockGetCats = vi.mocked(getCats);
const mockGetCatFact = vi.mocked(getCatFact);

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

const abyssinian: Breed = {
  breed: "Abyssinian",
  country: "Ethiopia",
  origin: "Natural/Standard",
  coat: "Short",
  pattern: "Ticked",
};

const aegean: Breed = {
  breed: "Aegean",
  country: "Greece",
  origin: "Natural/Standard",
  coat: "Semi-long",
  pattern: "Multi",
};

const sampleFact: CatFact = {
  fact: "Cats sleep 70% of their lives.",
  length: 31,
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
  mockGetCatFact.mockReset();
  mockGetCatFact.mockResolvedValue(sampleFact);
  mockNotFound.mockClear();
  mockSearchParams.delete("page");
  mockSearchParams.delete("q");
  getQueryClient().clear();
});

afterEach(() => {
  cleanup();
});

test("BreedDetailPage shows full breed fields from cached cats", async () => {
  mockGetCats.mockResolvedValue(makePage(1, 1, [abyssinian, aegean]));

  renderWithProviders(
    await BreedDetailPage({
      params: Promise.resolve({ slug: "abyssinian" }),
    }),
  );

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 1, name: "Abyssinian" }),
    ).toBeDefined();
  });

  expect(screen.getByText("Ethiopia")).toBeDefined();
  expect(screen.getByText("Natural/Standard")).toBeDefined();
  expect(screen.getByText("Short")).toBeDefined();
  expect(screen.getByText("Ticked")).toBeDefined();
  expect(
    screen.getByRole("link", { name: "← Back to directory" }).getAttribute("href"),
  ).toBe("/");
});

test("CatDetail back link preserves q and page from the URL", async () => {
  mockGetCats.mockResolvedValue(makePage(1, 1, [abyssinian]));
  mockSearchParams.set("q", "Aby");
  mockSearchParams.set("page", "3");

  renderWithProviders(<CatDetail slug="abyssinian" />);

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 1, name: "Abyssinian" }),
    ).toBeDefined();
  });

  expect(
    screen.getByRole("link", { name: "← Back to directory" }).getAttribute("href"),
  ).toBe("/?page=3&q=Aby");
});

test("CatDetail fetches next pages until slug is found", async () => {
  mockGetCats.mockImplementation(async (params) => {
    const page = params?.page ?? 1;
    if (page === 1) {
      return makePage(1, 2, [abyssinian]);
    }
    return makePage(2, 2, [aegean]);
  });

  renderWithProviders(<CatDetail slug="aegean" />);

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 1, name: "Aegean" }),
    ).toBeDefined();
  });

  expect(mockGetCats).toHaveBeenCalledWith({ page: 1, limit: 10 });
  expect(mockGetCats).toHaveBeenCalledWith({ page: 2, limit: 10 });
  expect(screen.getByText("Greece")).toBeDefined();
});

test("CatDetail calls notFound when slug is missing after all pages", async () => {
  mockGetCats.mockResolvedValue(makePage(1, 1, [abyssinian]));

  renderWithProviders(<CatDetail slug="siamese" />);

  await waitFor(() => {
    expect(mockNotFound).toHaveBeenCalled();
  });
});

test("CatDetail shows Retry when fetchNextPage fails while resolving slug", async () => {
  mockGetCats.mockImplementation(async (params) => {
    const page = params?.page ?? 1;
    if (page === 1) {
      return makePage(1, 2, [abyssinian]);
    }
    throw new Error("page 2 failed");
  });

  renderWithProviders(<CatDetail slug="aegean" />);

  await waitFor(() => {
    expect(screen.getByText("Error loading more breeds.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
  });

  expect(mockNotFound).not.toHaveBeenCalled();
  expect(screen.queryByText("Loading...")).toBeNull();

  mockGetCats.mockResolvedValueOnce(makePage(2, 2, [aegean]));
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 1, name: "Aegean" }),
    ).toBeDefined();
  });
});

test("CatDetail initial error shows Retry via refetch", async () => {
  mockGetCats.mockRejectedValue(new Error("Network down"));

  renderWithProviders(<CatDetail slug="abyssinian" />);

  await waitFor(() => {
    expect(screen.getByText("Network down")).toBeDefined();
    expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
  });

  mockGetCats.mockResolvedValue(makePage(1, 1, [abyssinian]));
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 1, name: "Abyssinian" }),
    ).toBeDefined();
  });
});

test("CatDetail shows breed info while random fact loads, then the fact", async () => {
  mockGetCats.mockResolvedValue(makePage(1, 1, [abyssinian]));

  let resolveFact!: (value: CatFact) => void;
  mockGetCatFact.mockImplementation(
    () =>
      new Promise<CatFact>((resolve) => {
        resolveFact = resolve;
      }),
  );

  renderWithProviders(<CatDetail slug="abyssinian" />);

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 1, name: "Abyssinian" }),
    ).toBeDefined();
  });

  expect(screen.getByRole("heading", { level: 2, name: "Random fact" })).toBeDefined();
  expect(screen.getByText("Loading...")).toBeDefined();
  expect(screen.getByText("Ethiopia")).toBeDefined();

  resolveFact(sampleFact);

  await waitFor(() => {
    expect(screen.getByText(sampleFact.fact)).toBeDefined();
  });

  expect(screen.queryByText("Loading...")).toBeNull();
});

test("CatDetail fetches a new fact for each breed slug", async () => {
  mockGetCats.mockResolvedValue(makePage(1, 1, [abyssinian, aegean]));
  mockGetCatFact
    .mockResolvedValueOnce({ fact: "Fact for Abyssinian", length: 18 })
    .mockResolvedValueOnce({ fact: "Fact for Aegean", length: 15 });

  renderWithProviders(<CatDetail slug="abyssinian" />);

  await waitFor(() => {
    expect(screen.getByText("Fact for Abyssinian")).toBeDefined();
  });

  expect(mockGetCatFact).toHaveBeenCalledTimes(1);

  cleanup();
  renderWithProviders(<CatDetail slug="aegean" />);

  await waitFor(() => {
    expect(screen.getByText("Fact for Aegean")).toBeDefined();
  });

  expect(mockGetCatFact).toHaveBeenCalledTimes(2);
});

test("RandomFact shows empty state for blank fact text", async () => {
  mockGetCats.mockResolvedValue(makePage(1, 1, [abyssinian]));
  mockGetCatFact.mockResolvedValue({ fact: "   ", length: 3 });

  renderWithProviders(<CatDetail slug="abyssinian" />);

  await waitFor(() => {
    expect(screen.getByText("No fact available right now.")).toBeDefined();
  });
});

test("RandomFact error shows Retry via refetch", async () => {
  mockGetCats.mockResolvedValue(makePage(1, 1, [abyssinian]));
  mockGetCatFact.mockRejectedValue(new Error("fact failed"));

  renderWithProviders(<CatDetail slug="abyssinian" />);

  await waitFor(() => {
    expect(screen.getByText("fact failed")).toBeDefined();
    expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
  });

  mockGetCatFact.mockResolvedValue(sampleFact);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));

  await waitFor(() => {
    expect(screen.getByText(sampleFact.fact)).toBeDefined();
  });
});
