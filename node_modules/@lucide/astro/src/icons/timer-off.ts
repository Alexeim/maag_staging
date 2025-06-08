
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name TimerOff
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgMmg0IiAvPgogIDxwYXRoIGQ9Ik00LjYgMTFhOCA4IDAgMCAwIDEuNyA4LjcgOCA4IDAgMCAwIDguNyAxLjciIC8+CiAgPHBhdGggZD0iTTcuNCA3LjRhOCA4IDAgMCAxIDEwLjMgMSA4IDggMCAwIDEgLjkgMTAuMiIgLz4KICA8cGF0aCBkPSJtMiAyIDIwIDIwIiAvPgogIDxwYXRoIGQ9Ik0xMiAxMnYtMiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/timer-off
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const TimerOff = createLucideIcon('timer-off', [["path",{"d":"M10 2h4"}],["path",{"d":"M4.6 11a8 8 0 0 0 1.7 8.7 8 8 0 0 0 8.7 1.7"}],["path",{"d":"M7.4 7.4a8 8 0 0 1 10.3 1 8 8 0 0 1 .9 10.2"}],["path",{"d":"m2 2 20 20"}],["path",{"d":"M12 12v-2"}]]) as AstroComponent;

export default TimerOff;
