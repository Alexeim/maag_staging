
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name TriangleDashed
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAuMTcgNC4xOTNhMiAyIDAgMCAxIDMuNjY2LjAxMyIgLz4KICA8cGF0aCBkPSJNMTQgMjFoMiIgLz4KICA8cGF0aCBkPSJtMTUuODc0IDcuNzQzIDEgMS43MzIiIC8+CiAgPHBhdGggZD0ibTE4Ljg0OSAxMi45NTIgMSAxLjczMiIgLz4KICA8cGF0aCBkPSJNMjEuODI0IDE4LjE4YTIgMiAwIDAgMS0xLjgzNSAyLjgyNCIgLz4KICA8cGF0aCBkPSJNNC4wMjQgMjFhMiAyIDAgMCAxLTEuODM5LTIuODM5IiAvPgogIDxwYXRoIGQ9Im01LjEzNiAxMi45NTItMSAxLjczMiIgLz4KICA8cGF0aCBkPSJNOCAyMWgyIiAvPgogIDxwYXRoIGQ9Im04LjEwMiA3Ljc0My0xIDEuNzMyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/triangle-dashed
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const TriangleDashed = createLucideIcon('triangle-dashed', [["path",{"d":"M10.17 4.193a2 2 0 0 1 3.666.013"}],["path",{"d":"M14 21h2"}],["path",{"d":"m15.874 7.743 1 1.732"}],["path",{"d":"m18.849 12.952 1 1.732"}],["path",{"d":"M21.824 18.18a2 2 0 0 1-1.835 2.824"}],["path",{"d":"M4.024 21a2 2 0 0 1-1.839-2.839"}],["path",{"d":"m5.136 12.952-1 1.732"}],["path",{"d":"M8 21h2"}],["path",{"d":"m8.102 7.743-1 1.732"}]]) as AstroComponent;

export default TriangleDashed;
