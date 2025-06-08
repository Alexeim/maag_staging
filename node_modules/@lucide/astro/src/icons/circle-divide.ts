
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CircleDivide
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8bGluZSB4MT0iOCIgeDI9IjE2IiB5MT0iMTIiIHkyPSIxMiIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIxMiIgeTE9IjE2IiB5Mj0iMTYiIC8+CiAgPGxpbmUgeDE9IjEyIiB4Mj0iMTIiIHkxPSI4IiB5Mj0iOCIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/circle-divide
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CircleDivide = createLucideIcon('circle-divide', [["line",{"x1":"8","x2":"16","y1":"12","y2":"12"}],["line",{"x1":"12","x2":"12","y1":"16","y2":"16"}],["line",{"x1":"12","x2":"12","y1":"8","y2":"8"}],["circle",{"cx":"12","cy":"12","r":"10"}]]) as AstroComponent;

export default CircleDivide;
