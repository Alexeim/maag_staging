export const hasRelatedContentEntries = (relatedContent: unknown): boolean => {
  if (!relatedContent || typeof relatedContent !== "object") {
    return false;
  }
  return Object.values(relatedContent).some(
    (value) => Array.isArray(value) && value.length > 0,
  );
};
