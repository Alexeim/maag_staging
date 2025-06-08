
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ArrowRightToLine
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTcgMTJIMyIgLz4KICA8cGF0aCBkPSJtMTEgMTggNi02LTYtNiIgLz4KICA8cGF0aCBkPSJNMjEgNXYxNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/arrow-right-to-line
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ArrowRightToLine = createLucideIcon('arrow-right-to-line', [["path",{"d":"M17 12H3"}],["path",{"d":"m11 18 6-6-6-6"}],["path",{"d":"M21 5v14"}]]) as AstroComponent;

export default ArrowRightToLine;
