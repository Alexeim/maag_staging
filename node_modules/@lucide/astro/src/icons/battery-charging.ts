
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name BatteryCharging
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTEgNy0zIDVoNGwtMyA1IiAvPgogIDxwYXRoIGQ9Ik0xNC44NTYgNkgxNmEyIDIgMCAwIDEgMiAydjhhMiAyIDAgMCAxLTIgMmgtMi45MzUiIC8+CiAgPHBhdGggZD0iTTIyIDE0di00IiAvPgogIDxwYXRoIGQ9Ik01LjE0IDE4SDRhMiAyIDAgMCAxLTItMlY4YTIgMiAwIDAgMSAyLTJoMi45MzYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/battery-charging
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const BatteryCharging = createLucideIcon('battery-charging', [["path",{"d":"m11 7-3 5h4l-3 5"}],["path",{"d":"M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935"}],["path",{"d":"M22 14v-4"}],["path",{"d":"M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936"}]]) as AstroComponent;

export default BatteryCharging;
