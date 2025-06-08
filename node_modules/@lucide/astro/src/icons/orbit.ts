
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Orbit
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAuMzQxIDYuNDg0QTEwIDEwIDAgMCAxIDEwLjI2NiAyMS44NSIgLz4KICA8cGF0aCBkPSJNMy42NTkgMTcuNTE2QTEwIDEwIDAgMCAxIDEzLjc0IDIuMTUyIiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIC8+CiAgPGNpcmNsZSBjeD0iMTkiIGN5PSI1IiByPSIyIiAvPgogIDxjaXJjbGUgY3g9IjUiIGN5PSIxOSIgcj0iMiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/orbit
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Orbit = createLucideIcon('orbit', [["path",{"d":"M20.341 6.484A10 10 0 0 1 10.266 21.85"}],["path",{"d":"M3.659 17.516A10 10 0 0 1 13.74 2.152"}],["circle",{"cx":"12","cy":"12","r":"3"}],["circle",{"cx":"19","cy":"5","r":"2"}],["circle",{"cx":"5","cy":"19","r":"2"}]]) as AstroComponent;

export default Orbit;
