
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ArrowDownFromLine
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTkgM0g1IiAvPgogIDxwYXRoIGQ9Ik0xMiAyMVY3IiAvPgogIDxwYXRoIGQ9Im02IDE1IDYgNiA2LTYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/arrow-down-from-line
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ArrowDownFromLine = createLucideIcon('arrow-down-from-line', [["path",{"d":"M19 3H5"}],["path",{"d":"M12 21V7"}],["path",{"d":"m6 15 6 6 6-6"}]]) as AstroComponent;

export default ArrowDownFromLine;
