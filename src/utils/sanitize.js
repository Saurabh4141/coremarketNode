/**
 * Cleans report titles for frontend usage
 * @param {string} title
 * @returns {string}
 */
export const sanitizeTitle = (title = "") => {
  if (!title) return "";

  let cleanTitle = title.trim();

  // Remove wrapping quotes " or '
  if (
    (cleanTitle.startsWith('"') && cleanTitle.endsWith('"')) ||
    (cleanTitle.startsWith("'") && cleanTitle.endsWith("'"))
  ) {
    cleanTitle = cleanTitle.slice(1, -1);
  }

  // Remove everything after |
  if (cleanTitle.includes("|")) {
    cleanTitle = cleanTitle.split("|")[0];
  }

  return cleanTitle.trim();
};
