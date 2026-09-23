import { expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BreedDetailPage from "../app/breeds/[slug]/page";
import CatDetail from "../components/cat-detail";
import { getCats } from "@/lib/api";
import type { Breed, Paginated } from "@/lib/api";
import { getQueryClient } from "@/lib/query/get-query-client";

vi.mock("@/lib/api", () => ({
  getCats: vi.fn(),
}));

const mockNotFound = vi.fn(() => null);

vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

const mockGetCats = vi.mocked(getCats);

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
  mockNotFound.mockClear();
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
