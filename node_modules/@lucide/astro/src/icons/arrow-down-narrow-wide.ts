
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ArrowDownNarrowWide
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMyAxNiA0IDQgNC00IiAvPgogIDxwYXRoIGQ9Ik03IDIwVjQiIC8+CiAgPHBhdGggZD0iTTExIDRoNCIgLz4KICA8cGF0aCBkPSJNMTEgOGg3IiAvPgogIDxwYXRoIGQ9Ik0xMSAxMmgxMCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/arrow-down-narrow-wide
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ArrowDownNarrowWide = createLucideIcon('arrow-down-narrow-wide', [["path",{"d":"m3 16 4 4 4-4"}],["path",{"d":"M7 20V4"}],["path",{"d":"M11 4h4"}],["path",{"d":"M11 8h7"}],["path",{"d":"M11 12h10"}]]) as AstroComponent;

export default ArrowDownNarrowWide;
