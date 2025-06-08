
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name BookUp2
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTNWNyIgLz4KICA8cGF0aCBkPSJNMTggMmgxYTEgMSAwIDAgMSAxIDF2MThhMSAxIDAgMCAxLTEgMUg2LjVhMSAxIDAgMCAxIDAtNUgyMCIgLz4KICA8cGF0aCBkPSJNNCAxOS41di0xNUEyLjUgMi41IDAgMCAxIDYuNSAyIiAvPgogIDxwYXRoIGQ9Im05IDEwIDMtMyAzIDMiIC8+CiAgPHBhdGggZD0ibTkgNSAzLTMgMyAzIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/book-up-2
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const BookUp2 = createLucideIcon('book-up-2', [["path",{"d":"M12 13V7"}],["path",{"d":"M18 2h1a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"}],["path",{"d":"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2"}],["path",{"d":"m9 10 3-3 3 3"}],["path",{"d":"m9 5 3-3 3 3"}]]) as AstroComponent;

export default BookUp2;
