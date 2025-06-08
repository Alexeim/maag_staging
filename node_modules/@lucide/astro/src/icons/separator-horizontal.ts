
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name SeparatorHorizontal
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTYgMTYtNCA0LTQtNCIgLz4KICA8cGF0aCBkPSJNMyAxMmgxOCIgLz4KICA8cGF0aCBkPSJtOCA4IDQtNCA0IDQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/separator-horizontal
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const SeparatorHorizontal = createLucideIcon('separator-horizontal', [["path",{"d":"m16 16-4 4-4-4"}],["path",{"d":"M3 12h18"}],["path",{"d":"m8 8 4-4 4 4"}]]) as AstroComponent;

export default SeparatorHorizontal;
