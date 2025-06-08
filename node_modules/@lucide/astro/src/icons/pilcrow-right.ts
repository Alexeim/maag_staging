
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name PilcrowRight
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgM3YxMSIgLz4KICA8cGF0aCBkPSJNMTAgOUg3YTEgMSAwIDAgMSAwLTZoOCIgLz4KICA8cGF0aCBkPSJNMTQgM3YxMSIgLz4KICA8cGF0aCBkPSJtMTggMTQgNCA0SDIiIC8+CiAgPHBhdGggZD0ibTIyIDE4LTQgNCIgLz4KPC9zdmc+) - https://lucide.dev/icons/pilcrow-right
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const PilcrowRight = createLucideIcon('pilcrow-right', [["path",{"d":"M10 3v11"}],["path",{"d":"M10 9H7a1 1 0 0 1 0-6h8"}],["path",{"d":"M14 3v11"}],["path",{"d":"m18 14 4 4H2"}],["path",{"d":"m22 18-4 4"}]]) as AstroComponent;

export default PilcrowRight;
