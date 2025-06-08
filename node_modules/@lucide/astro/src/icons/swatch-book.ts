
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name SwatchBook
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTEgMTdhNCA0IDAgMCAxLTggMFY1YTIgMiAwIDAgMSAyLTJoNGEyIDIgMCAwIDEgMiAyWiIgLz4KICA8cGF0aCBkPSJNMTYuNyAxM0gxOWEyIDIgMCAwIDEgMiAydjRhMiAyIDAgMCAxLTIgMkg3IiAvPgogIDxwYXRoIGQ9Ik0gNyAxN2guMDEiIC8+CiAgPHBhdGggZD0ibTExIDggMi4zLTIuM2EyLjQgMi40IDAgMCAxIDMuNDA0LjAwNEwxOC42IDcuNmEyLjQgMi40IDAgMCAxIC4wMjYgMy40MzRMOS45IDE5LjgiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/swatch-book
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const SwatchBook = createLucideIcon('swatch-book', [["path",{"d":"M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z"}],["path",{"d":"M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7"}],["path",{"d":"M 7 17h.01"}],["path",{"d":"m11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8"}]]) as AstroComponent;

export default SwatchBook;
