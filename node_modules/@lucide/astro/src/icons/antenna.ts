
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Antenna
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMiAxMiA3IDIiIC8+CiAgPHBhdGggZD0ibTcgMTIgNS0xMCIgLz4KICA8cGF0aCBkPSJtMTIgMTIgNS0xMCIgLz4KICA8cGF0aCBkPSJtMTcgMTIgNS0xMCIgLz4KICA8cGF0aCBkPSJNNC41IDdoMTUiIC8+CiAgPHBhdGggZD0iTTEyIDE2djYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/antenna
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Antenna = createLucideIcon('antenna', [["path",{"d":"M2 12 7 2"}],["path",{"d":"m7 12 5-10"}],["path",{"d":"m12 12 5-10"}],["path",{"d":"m17 12 5-10"}],["path",{"d":"M4.5 7h15"}],["path",{"d":"M12 16v6"}]]) as AstroComponent;

export default Antenna;
