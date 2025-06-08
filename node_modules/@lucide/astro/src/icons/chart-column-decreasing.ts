
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ChartColumnDecreasing
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTMgMTdWOSIgLz4KICA8cGF0aCBkPSJNMTggMTd2LTMiIC8+CiAgPHBhdGggZD0iTTMgM3YxNmEyIDIgMCAwIDAgMiAyaDE2IiAvPgogIDxwYXRoIGQ9Ik04IDE3VjUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/chart-column-decreasing
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ChartColumnDecreasing = createLucideIcon('chart-column-decreasing', [["path",{"d":"M13 17V9"}],["path",{"d":"M18 17v-3"}],["path",{"d":"M3 3v16a2 2 0 0 0 2 2h16"}],["path",{"d":"M8 17V5"}]]) as AstroComponent;

export default ChartColumnDecreasing;
