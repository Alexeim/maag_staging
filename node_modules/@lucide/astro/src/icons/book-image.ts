
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name BookImage
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMjAgMTMuNy0yLjEtMi4xYTIgMiAwIDAgMC0yLjggMEw5LjcgMTciIC8+CiAgPHBhdGggZD0iTTQgMTkuNXYtMTVBMi41IDIuNSAwIDAgMSA2LjUgMkgxOWExIDEgMCAwIDEgMSAxdjE4YTEgMSAwIDAgMS0xIDFINi41YTEgMSAwIDAgMSAwLTVIMjAiIC8+CiAgPGNpcmNsZSBjeD0iMTAiIGN5PSI4IiByPSIyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/book-image
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const BookImage = createLucideIcon('book-image', [["path",{"d":"m20 13.7-2.1-2.1a2 2 0 0 0-2.8 0L9.7 17"}],["path",{"d":"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"}],["circle",{"cx":"10","cy":"8","r":"2"}]]) as AstroComponent;

export default BookImage;
