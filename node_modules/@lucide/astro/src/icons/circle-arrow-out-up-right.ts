
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CircleArrowOutUpRight
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjIgMTJBMTAgMTAgMCAxIDEgMTIgMiIgLz4KICA8cGF0aCBkPSJNMjIgMiAxMiAxMiIgLz4KICA8cGF0aCBkPSJNMTYgMmg2djYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/circle-arrow-out-up-right
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CircleArrowOutUpRight = createLucideIcon('circle-arrow-out-up-right', [["path",{"d":"M22 12A10 10 0 1 1 12 2"}],["path",{"d":"M22 2 12 12"}],["path",{"d":"M16 2h6v6"}]]) as AstroComponent;

export default CircleArrowOutUpRight;
