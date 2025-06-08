
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ChartBarIncreasing
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyAzdjE2YTIgMiAwIDAgMCAyIDJoMTYiIC8+CiAgPHBhdGggZD0iTTcgMTFoOCIgLz4KICA8cGF0aCBkPSJNNyAxNmgxMiIgLz4KICA8cGF0aCBkPSJNNyA2aDMiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/chart-bar-increasing
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ChartBarIncreasing = createLucideIcon('chart-bar-increasing', [["path",{"d":"M3 3v16a2 2 0 0 0 2 2h16"}],["path",{"d":"M7 11h8"}],["path",{"d":"M7 16h12"}],["path",{"d":"M7 6h3"}]]) as AstroComponent;

export default ChartBarIncreasing;
