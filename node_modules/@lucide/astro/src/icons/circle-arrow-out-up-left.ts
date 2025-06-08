
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CircleArrowOutUpLeft
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMiA4VjJoNiIgLz4KICA8cGF0aCBkPSJtMiAyIDEwIDEwIiAvPgogIDxwYXRoIGQ9Ik0xMiAyQTEwIDEwIDAgMSAxIDIgMTIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/circle-arrow-out-up-left
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CircleArrowOutUpLeft = createLucideIcon('circle-arrow-out-up-left', [["path",{"d":"M2 8V2h6"}],["path",{"d":"m2 2 10 10"}],["path",{"d":"M12 2A10 10 0 1 1 2 12"}]]) as AstroComponent;

export default CircleArrowOutUpLeft;
