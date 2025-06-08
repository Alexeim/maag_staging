
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CircleEllipsis
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJNMTcgMTJoLjAxIiAvPgogIDxwYXRoIGQ9Ik0xMiAxMmguMDEiIC8+CiAgPHBhdGggZD0iTTcgMTJoLjAxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/circle-ellipsis
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CircleEllipsis = createLucideIcon('circle-ellipsis', [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M17 12h.01"}],["path",{"d":"M12 12h.01"}],["path",{"d":"M7 12h.01"}]]) as AstroComponent;

export default CircleEllipsis;
