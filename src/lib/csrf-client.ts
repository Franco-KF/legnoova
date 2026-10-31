export const CSRF_HEADER_NAME = "x-requested-with";
export const CSRF_HEADER_VALUE = "XMLHttpRequest";

/** Headers for cookie-authenticated browser mutations. */
export function mutationHeaders(
  headers: Record<string, string> = {}
): Record<string, string> {
  return { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE, ...headers };
}
