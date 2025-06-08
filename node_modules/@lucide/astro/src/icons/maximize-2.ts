
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Maximize2
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgM2g2djYiIC8+CiAgPHBhdGggZD0ibTIxIDMtNyA3IiAvPgogIDxwYXRoIGQ9Im0zIDIxIDctNyIgLz4KICA8cGF0aCBkPSJNOSAyMUgzdi02IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/maximize-2
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Maximize2 = createLucideIcon('maximize-2', [["path",{"d":"M15 3h6v6"}],["path",{"d":"m21 3-7 7"}],["path",{"d":"m3 21 7-7"}],["path",{"d":"M9 21H3v-6"}]]) as AstroComponent;

export default Maximize2;
