
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name SquareArrowOutDownLeft
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTMgMjFoNmEyIDIgMCAwIDAgMi0yVjVhMiAyIDAgMCAwLTItMkg1YTIgMiAwIDAgMC0yIDJ2NiIgLz4KICA8cGF0aCBkPSJtMyAyMSA5LTkiIC8+CiAgPHBhdGggZD0iTTkgMjFIM3YtNiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/square-arrow-out-down-left
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const SquareArrowOutDownLeft = createLucideIcon('square-arrow-out-down-left', [["path",{"d":"M13 21h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6"}],["path",{"d":"m3 21 9-9"}],["path",{"d":"M9 21H3v-6"}]]) as AstroComponent;

export default SquareArrowOutDownLeft;
