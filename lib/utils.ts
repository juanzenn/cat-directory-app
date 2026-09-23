export { cn } from "cn";

/** Show an em dash when a string field is blank / whitespace. */
export function displayValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "—";
}
