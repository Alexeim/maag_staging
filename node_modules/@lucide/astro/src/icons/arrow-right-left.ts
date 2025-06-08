
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ArrowRightLeft
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTYgMyA0IDQtNCA0IiAvPgogIDxwYXRoIGQ9Ik0yMCA3SDQiIC8+CiAgPHBhdGggZD0ibTggMjEtNC00IDQtNCIgLz4KICA8cGF0aCBkPSJNNCAxN2gxNiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/arrow-right-left
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ArrowRightLeft = createLucideIcon('arrow-right-left', [["path",{"d":"m16 3 4 4-4 4"}],["path",{"d":"M20 7H4"}],["path",{"d":"m8 21-4-4 4-4"}],["path",{"d":"M4 17h16"}]]) as AstroComponent;

export default ArrowRightLeft;
