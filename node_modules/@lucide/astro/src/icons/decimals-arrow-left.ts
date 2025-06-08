
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name DecimalsArrowLeft
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTMgMjEtMy0zIDMtMyIgLz4KICA8cGF0aCBkPSJNMjAgMThIMTAiIC8+CiAgPHBhdGggZD0iTTMgMTFoLjAxIiAvPgogIDxyZWN0IHg9IjYiIHk9IjMiIHdpZHRoPSI1IiBoZWlnaHQ9IjgiIHJ4PSIyLjUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/decimals-arrow-left
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const DecimalsArrowLeft = createLucideIcon('decimals-arrow-left', [["path",{"d":"m13 21-3-3 3-3"}],["path",{"d":"M20 18H10"}],["path",{"d":"M3 11h.01"}],["rect",{"x":"6","y":"3","width":"5","height":"8","rx":"2.5"}]]) as AstroComponent;

export default DecimalsArrowLeft;
