
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Crosshair
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8bGluZSB4MT0iMjIiIHgyPSIxOCIgeTE9IjEyIiB5Mj0iMTIiIC8+CiAgPGxpbmUgeDE9IjYiIHgyPSIyIiB5MT0iMTIiIHkyPSIxMiIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIxMiIgeTE9IjYiIHkyPSIyIiAvPgogIDxsaW5lIHgxPSIxMiIgeDI9IjEyIiB5MT0iMjIiIHkyPSIxOCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/crosshair
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Crosshair = createLucideIcon('crosshair', [["circle",{"cx":"12","cy":"12","r":"10"}],["line",{"x1":"22","x2":"18","y1":"12","y2":"12"}],["line",{"x1":"6","x2":"2","y1":"12","y2":"12"}],["line",{"x1":"12","x2":"12","y1":"6","y2":"2"}],["line",{"x1":"12","x2":"12","y1":"22","y2":"18"}]]) as AstroComponent;

export default Crosshair;
