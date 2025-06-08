
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name UndoDot
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEgMTdhOSA5IDAgMCAwLTE1LTYuN0wzIDEzIiAvPgogIDxwYXRoIGQ9Ik0zIDd2Nmg2IiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTciIHI9IjEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/undo-dot
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const UndoDot = createLucideIcon('undo-dot', [["path",{"d":"M21 17a9 9 0 0 0-15-6.7L3 13"}],["path",{"d":"M3 7v6h6"}],["circle",{"cx":"12","cy":"17","r":"1"}]]) as AstroComponent;

export default UndoDot;
