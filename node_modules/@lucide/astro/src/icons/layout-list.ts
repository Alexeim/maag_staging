
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name LayoutList
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI3IiB4PSIzIiB5PSIzIiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI3IiB4PSIzIiB5PSIxNCIgcng9IjEiIC8+CiAgPHBhdGggZD0iTTE0IDRoNyIgLz4KICA8cGF0aCBkPSJNMTQgOWg3IiAvPgogIDxwYXRoIGQ9Ik0xNCAxNWg3IiAvPgogIDxwYXRoIGQ9Ik0xNCAyMGg3IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/layout-list
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const LayoutList = createLucideIcon('layout-list', [["rect",{"width":"7","height":"7","x":"3","y":"3","rx":"1"}],["rect",{"width":"7","height":"7","x":"3","y":"14","rx":"1"}],["path",{"d":"M14 4h7"}],["path",{"d":"M14 9h7"}],["path",{"d":"M14 15h7"}],["path",{"d":"M14 20h7"}]]) as AstroComponent;

export default LayoutList;
