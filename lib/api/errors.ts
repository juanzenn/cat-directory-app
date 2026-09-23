/** User-facing message from an unknown thrown/query error. */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Try again.",
): string {
  if (!(error instanceof Error) || error.message.trim().length === 0) {
    return fallback;
  }

  const message = error.message.trim();

  if (
    message === "Network Error" ||
    message.toLowerCase().includes("network error")
  ) {
    return "Network error. Check your connection and try again.";
  }

  return message;
}
