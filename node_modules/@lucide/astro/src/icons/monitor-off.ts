
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name MonitorOff
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTcgMTdINGEyIDIgMCAwIDEtMi0yVjVjMC0xLjUgMS0yIDEtMiIgLz4KICA8cGF0aCBkPSJNMjIgMTVWNWEyIDIgMCAwIDAtMi0ySDkiIC8+CiAgPHBhdGggZD0iTTggMjFoOCIgLz4KICA8cGF0aCBkPSJNMTIgMTd2NCIgLz4KICA8cGF0aCBkPSJtMiAyIDIwIDIwIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/monitor-off
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const MonitorOff = createLucideIcon('monitor-off', [["path",{"d":"M17 17H4a2 2 0 0 1-2-2V5c0-1.5 1-2 1-2"}],["path",{"d":"M22 15V5a2 2 0 0 0-2-2H9"}],["path",{"d":"M8 21h8"}],["path",{"d":"M12 17v4"}],["path",{"d":"m2 2 20 20"}]]) as AstroComponent;

export default MonitorOff;
