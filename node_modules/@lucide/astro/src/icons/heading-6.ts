
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Heading6
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCAxMmg4IiAvPgogIDxwYXRoIGQ9Ik00IDE4VjYiIC8+CiAgPHBhdGggZD0iTTEyIDE4VjYiIC8+CiAgPGNpcmNsZSBjeD0iMTkiIGN5PSIxNiIgcj0iMiIgLz4KICA8cGF0aCBkPSJNMjAgMTBjLTIgMi0zIDMuNS0zIDYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/heading-6
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Heading6 = createLucideIcon('heading-6', [["path",{"d":"M4 12h8"}],["path",{"d":"M4 18V6"}],["path",{"d":"M12 18V6"}],["circle",{"cx":"19","cy":"16","r":"2"}],["path",{"d":"M20 10c-2 2-3 3.5-3 6"}]]) as AstroComponent;

export default Heading6;
