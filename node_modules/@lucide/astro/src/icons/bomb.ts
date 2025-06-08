
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Bomb
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMSIgY3k9IjEzIiByPSI5IiAvPgogIDxwYXRoIGQ9Ik0xNC4zNSA0LjY1IDE2LjMgMi43YTIuNDEgMi40MSAwIDAgMSAzLjQgMGwxLjYgMS42YTIuNCAyLjQgMCAwIDEgMCAzLjRsLTEuOTUgMS45NSIgLz4KICA8cGF0aCBkPSJtMjIgMi0xLjUgMS41IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/bomb
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Bomb = createLucideIcon('bomb', [["circle",{"cx":"11","cy":"13","r":"9"}],["path",{"d":"M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95"}],["path",{"d":"m22 2-1.5 1.5"}]]) as AstroComponent;

export default Bomb;
