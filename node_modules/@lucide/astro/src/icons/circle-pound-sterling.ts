
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CirclePoundSterling
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgMTZWOS41YTEgMSAwIDAgMSA1IDAiIC8+CiAgPHBhdGggZD0iTTggMTJoNCIgLz4KICA8cGF0aCBkPSJNOCAxNmg3IiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/circle-pound-sterling
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CirclePoundSterling = createLucideIcon('circle-pound-sterling', [["path",{"d":"M10 16V9.5a1 1 0 0 1 5 0"}],["path",{"d":"M8 12h4"}],["path",{"d":"M8 16h7"}],["circle",{"cx":"12","cy":"12","r":"10"}]]) as AstroComponent;

export default CirclePoundSterling;
