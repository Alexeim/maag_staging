// A translated string dropped into an Alpine expression written in an
// attribute (x-text, x-bind:…): it must become a JS string literal there.
// Single quotes, so the Russian output stays what it was hand-written as;
// apostrophes ("jusqu'au") and backslashes are escaped.
export const alpineString = (value: string): string =>
  `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
