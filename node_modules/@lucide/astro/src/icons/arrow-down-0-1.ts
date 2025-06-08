
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ArrowDown01
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMyAxNiA0IDQgNC00IiAvPgogIDxwYXRoIGQ9Ik03IDIwVjQiIC8+CiAgPHJlY3QgeD0iMTUiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjYiIHJ5PSIyIiAvPgogIDxwYXRoIGQ9Ik0xNyAyMHYtNmgtMiIgLz4KICA8cGF0aCBkPSJNMTUgMjBoNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/arrow-down-0-1
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ArrowDown01 = createLucideIcon('arrow-down-0-1', [["path",{"d":"m3 16 4 4 4-4"}],["path",{"d":"M7 20V4"}],["rect",{"x":"15","y":"4","width":"4","height":"6","ry":"2"}],["path",{"d":"M17 20v-6h-2"}],["path",{"d":"M15 20h4"}]]) as AstroComponent;

export default ArrowDown01;
