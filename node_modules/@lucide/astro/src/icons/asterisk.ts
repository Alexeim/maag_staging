
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Asterisk
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgNnYxMiIgLz4KICA8cGF0aCBkPSJNMTcuMTk2IDkgNi44MDQgMTUiIC8+CiAgPHBhdGggZD0ibTYuODA0IDkgMTAuMzkyIDYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/asterisk
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Asterisk = createLucideIcon('asterisk', [["path",{"d":"M12 6v12"}],["path",{"d":"M17.196 9 6.804 15"}],["path",{"d":"m6.804 9 10.392 6"}]]) as AstroComponent;

export default Asterisk;
