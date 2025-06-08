
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name AlarmClockOff
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNi44NyA2Ljg3YTggOCAwIDEgMCAxMS4yNiAxMS4yNiIgLz4KICA8cGF0aCBkPSJNMTkuOSAxNC4yNWE4IDggMCAwIDAtOS4xNS05LjE1IiAvPgogIDxwYXRoIGQ9Im0yMiA2LTMtMyIgLz4KICA8cGF0aCBkPSJNNi4yNiAxOC42NyA0IDIxIiAvPgogIDxwYXRoIGQ9Im0yIDIgMjAgMjAiIC8+CiAgPHBhdGggZD0iTTQgNCAyIDYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/alarm-clock-off
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const AlarmClockOff = createLucideIcon('alarm-clock-off', [["path",{"d":"M6.87 6.87a8 8 0 1 0 11.26 11.26"}],["path",{"d":"M19.9 14.25a8 8 0 0 0-9.15-9.15"}],["path",{"d":"m22 6-3-3"}],["path",{"d":"M6.26 18.67 4 21"}],["path",{"d":"m2 2 20 20"}],["path",{"d":"M4 4 2 6"}]]) as AstroComponent;

export default AlarmClockOff;
