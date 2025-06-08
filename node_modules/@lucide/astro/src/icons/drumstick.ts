
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Drumstick
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUuNCAxNS42M2E3Ljg3NSA2IDEzNSAxIDEgNi4yMy02LjIzIDQuNSAzLjQzIDEzNSAwIDAtNi4yMyA2LjIzIiAvPgogIDxwYXRoIGQ9Im04LjI5IDEyLjcxLTIuNiAyLjZhMi41IDIuNSAwIDEgMC0xLjY1IDQuNjVBMi41IDIuNSAwIDEgMCA4LjcgMTguM2wyLjU5LTIuNTkiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/drumstick
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Drumstick = createLucideIcon('drumstick', [["path",{"d":"M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23"}],["path",{"d":"m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59"}]]) as AstroComponent;

export default Drumstick;
