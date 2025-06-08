
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Currency
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiAvPgogIDxsaW5lIHgxPSIzIiB4Mj0iNiIgeTE9IjMiIHkyPSI2IiAvPgogIDxsaW5lIHgxPSIyMSIgeDI9IjE4IiB5MT0iMyIgeTI9IjYiIC8+CiAgPGxpbmUgeDE9IjMiIHgyPSI2IiB5MT0iMjEiIHkyPSIxOCIgLz4KICA8bGluZSB4MT0iMjEiIHgyPSIxOCIgeTE9IjIxIiB5Mj0iMTgiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/currency
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Currency = createLucideIcon('currency', [["circle",{"cx":"12","cy":"12","r":"8"}],["line",{"x1":"3","x2":"6","y1":"3","y2":"6"}],["line",{"x1":"21","x2":"18","y1":"3","y2":"6"}],["line",{"x1":"3","x2":"6","y1":"21","y2":"18"}],["line",{"x1":"21","x2":"18","y1":"21","y2":"18"}]]) as AstroComponent;

export default Currency;
