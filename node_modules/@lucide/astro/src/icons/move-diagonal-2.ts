
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name MoveDiagonal2
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTkgMTN2NmgtNiIgLz4KICA8cGF0aCBkPSJNNSAxMVY1aDYiIC8+CiAgPHBhdGggZD0ibTUgNSAxNCAxNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/move-diagonal-2
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const MoveDiagonal2 = createLucideIcon('move-diagonal-2', [["path",{"d":"M19 13v6h-6"}],["path",{"d":"M5 11V5h6"}],["path",{"d":"m5 5 14 14"}]]) as AstroComponent;

export default MoveDiagonal2;
