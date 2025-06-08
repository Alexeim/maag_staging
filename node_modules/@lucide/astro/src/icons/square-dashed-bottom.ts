
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name SquareDashedBottom
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNSAyMWEyIDIgMCAwIDEtMi0yVjVhMiAyIDAgMCAxIDItMmgxNGEyIDIgMCAwIDEgMiAydjE0YTIgMiAwIDAgMS0yIDIiIC8+CiAgPHBhdGggZD0iTTkgMjFoMSIgLz4KICA8cGF0aCBkPSJNMTQgMjFoMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/square-dashed-bottom
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const SquareDashedBottom = createLucideIcon('square-dashed-bottom', [["path",{"d":"M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2"}],["path",{"d":"M9 21h1"}],["path",{"d":"M14 21h1"}]]) as AstroComponent;

export default SquareDashedBottom;
