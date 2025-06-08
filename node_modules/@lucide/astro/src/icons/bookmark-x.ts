
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name BookmarkX
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTkgMjEtNy00LTcgNFY1YTIgMiAwIDAgMSAyLTJoMTBhMiAyIDAgMCAxIDIgMloiIC8+CiAgPHBhdGggZD0ibTE0LjUgNy41LTUgNSIgLz4KICA8cGF0aCBkPSJtOS41IDcuNSA1IDUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/bookmark-x
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const BookmarkX = createLucideIcon('bookmark-x', [["path",{"d":"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"}],["path",{"d":"m14.5 7.5-5 5"}],["path",{"d":"m9.5 7.5 5 5"}]]) as AstroComponent;

export default BookmarkX;
