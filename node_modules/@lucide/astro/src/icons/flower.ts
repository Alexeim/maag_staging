
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Flower
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIiAvPgogIDxwYXRoIGQ9Ik0xMiAxNi41QTQuNSA0LjUgMCAxIDEgNy41IDEyIDQuNSA0LjUgMCAxIDEgMTIgNy41YTQuNSA0LjUgMCAxIDEgNC41IDQuNSA0LjUgNC41IDAgMSAxLTQuNSA0LjUiIC8+CiAgPHBhdGggZD0iTTEyIDcuNVY5IiAvPgogIDxwYXRoIGQ9Ik03LjUgMTJIOSIgLz4KICA8cGF0aCBkPSJNMTYuNSAxMkgxNSIgLz4KICA8cGF0aCBkPSJNMTIgMTYuNVYxNSIgLz4KICA8cGF0aCBkPSJtOCA4IDEuODggMS44OCIgLz4KICA8cGF0aCBkPSJNMTQuMTIgOS44OCAxNiA4IiAvPgogIDxwYXRoIGQ9Im04IDE2IDEuODgtMS44OCIgLz4KICA8cGF0aCBkPSJNMTQuMTIgMTQuMTIgMTYgMTYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/flower
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Flower = createLucideIcon('flower', [["circle",{"cx":"12","cy":"12","r":"3"}],["path",{"d":"M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"}],["path",{"d":"M12 7.5V9"}],["path",{"d":"M7.5 12H9"}],["path",{"d":"M16.5 12H15"}],["path",{"d":"M12 16.5V15"}],["path",{"d":"m8 8 1.88 1.88"}],["path",{"d":"M14.12 9.88 16 8"}],["path",{"d":"m8 16 1.88-1.88"}],["path",{"d":"M14.12 14.12 16 16"}]]) as AstroComponent;

export default Flower;
