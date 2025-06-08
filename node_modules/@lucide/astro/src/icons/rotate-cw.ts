
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name RotateCw
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEgMTJhOSA5IDAgMSAxLTktOWMyLjUyIDAgNC45MyAxIDYuNzQgMi43NEwyMSA4IiAvPgogIDxwYXRoIGQ9Ik0yMSAzdjVoLTUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/rotate-cw
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const RotateCw = createLucideIcon('rotate-cw', [["path",{"d":"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"}],["path",{"d":"M21 3v5h-5"}]]) as AstroComponent;

export default RotateCw;
