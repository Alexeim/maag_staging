
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name EyeClosed
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTUgMTgtLjcyMi0zLjI1IiAvPgogIDxwYXRoIGQ9Ik0yIDhhMTAuNjQ1IDEwLjY0NSAwIDAgMCAyMCAwIiAvPgogIDxwYXRoIGQ9Im0yMCAxNS0xLjcyNi0yLjA1IiAvPgogIDxwYXRoIGQ9Im00IDE1IDEuNzI2LTIuMDUiIC8+CiAgPHBhdGggZD0ibTkgMTggLjcyMi0zLjI1IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/eye-closed
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const EyeClosed = createLucideIcon('eye-closed', [["path",{"d":"m15 18-.722-3.25"}],["path",{"d":"M2 8a10.645 10.645 0 0 0 20 0"}],["path",{"d":"m20 15-1.726-2.05"}],["path",{"d":"m4 15 1.726-2.05"}],["path",{"d":"m9 18 .722-3.25"}]]) as AstroComponent;

export default EyeClosed;
