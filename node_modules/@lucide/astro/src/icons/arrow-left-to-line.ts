
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ArrowLeftToLine
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyAxOVY1IiAvPgogIDxwYXRoIGQ9Im0xMyA2LTYgNiA2IDYiIC8+CiAgPHBhdGggZD0iTTcgMTJoMTQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/arrow-left-to-line
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ArrowLeftToLine = createLucideIcon('arrow-left-to-line', [["path",{"d":"M3 19V5"}],["path",{"d":"m13 6-6 6 6 6"}],["path",{"d":"M7 12h14"}]]) as AstroComponent;

export default ArrowLeftToLine;
