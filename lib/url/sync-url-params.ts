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
