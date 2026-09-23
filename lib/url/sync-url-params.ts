export function buildCatsSearchString({
  page,
  q,
}: {
  page?: number;
  q?: string;
}): string {
  const params = new URLSearchParams();

  if (page !== undefined && page > 1) {
    params.set("page", String(page));
  }

  if (q) {
    params.set("q", q);
  }

  const search = params.toString();
  return search ? `?${search}` : "";
}

export function directoryHref({
  page,
  q,
}: {
  page?: number;
  q?: string;
} = {}): string {
  return `/${buildCatsSearchString({ page, q })}`;
}

export function syncUrlParams({ page, q }: { page?: number; q?: string }) {
  const url = new URL(window.location.href);

  if (page !== undefined) {
    if (page <= 1) {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", String(page));
    }
  }

  if (q !== undefined) {
    if (!q) {
      url.searchParams.delete("q");
    } else {
      url.searchParams.set("q", q);
    }
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (next !== current) {
    window.history.replaceState(window.history.state, "", next);
  }
}
