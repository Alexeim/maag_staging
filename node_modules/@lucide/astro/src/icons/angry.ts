
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Angry
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJNMTYgMTZzLTEuNS0yLTQtMi00IDItNCAyIiAvPgogIDxwYXRoIGQ9Ik03LjUgOCAxMCA5IiAvPgogIDxwYXRoIGQ9Im0xNCA5IDIuNS0xIiAvPgogIDxwYXRoIGQ9Ik05IDEwaC4wMSIgLz4KICA8cGF0aCBkPSJNMTUgMTBoLjAxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/angry
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Angry = createLucideIcon('angry', [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M16 16s-1.5-2-4-2-4 2-4 2"}],["path",{"d":"M7.5 8 10 9"}],["path",{"d":"m14 9 2.5-1"}],["path",{"d":"M9 10h.01"}],["path",{"d":"M15 10h.01"}]]) as AstroComponent;

export default Angry;
