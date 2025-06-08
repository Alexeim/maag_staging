
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ArrowRightFromLine
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyA1djE0IiAvPgogIDxwYXRoIGQ9Ik0yMSAxMkg3IiAvPgogIDxwYXRoIGQ9Im0xNSAxOCA2LTYtNi02IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/arrow-right-from-line
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ArrowRightFromLine = createLucideIcon('arrow-right-from-line', [["path",{"d":"M3 5v14"}],["path",{"d":"M21 12H7"}],["path",{"d":"m15 18 6-6-6-6"}]]) as AstroComponent;

export default ArrowRightFromLine;
