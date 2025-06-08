
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Heading1
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCAxMmg4IiAvPgogIDxwYXRoIGQ9Ik00IDE4VjYiIC8+CiAgPHBhdGggZD0iTTEyIDE4VjYiIC8+CiAgPHBhdGggZD0ibTE3IDEyIDMtMnY4IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/heading-1
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Heading1 = createLucideIcon('heading-1', [["path",{"d":"M4 12h8"}],["path",{"d":"M4 18V6"}],["path",{"d":"M12 18V6"}],["path",{"d":"m17 12 3-2v8"}]]) as AstroComponent;

export default Heading1;
