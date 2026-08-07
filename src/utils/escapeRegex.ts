/**
 * Safely escapes special regex characters in a search string
 * to prevent Regex Injection vulnerabilities and search syntax errors.
 */
export function escapeRegex(stringToEscape: string): string {
  return stringToEscape.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
