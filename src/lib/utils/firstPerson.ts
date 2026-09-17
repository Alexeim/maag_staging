// "От первого лица" headlines are composed, not free text: the editor only
// types the tail ("о том, как он попал в DAU..."), and the author's full name
// is prepended automatically, with a single space and no colon.
export function composeFirstPersonTitle(
  authorFullName: string | undefined | null,
  title: string | undefined | null,
): string {
  const name = (authorFullName || "").trim();
  const text = (title || "").trim();
  if (!name) return text;
  if (!text) return name;
  return `${name} ${text}`;
}
