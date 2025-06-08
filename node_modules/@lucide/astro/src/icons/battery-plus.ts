
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name BatteryPlus
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgOXY2IiAvPgogIDxwYXRoIGQ9Ik0xMi41NDMgNkgxNmEyIDIgMCAwIDEgMiAydjhhMiAyIDAgMCAxLTIgMmgtMy42MDUiIC8+CiAgPHBhdGggZD0iTTIyIDE0di00IiAvPgogIDxwYXRoIGQ9Ik03IDEyaDYiIC8+CiAgPHBhdGggZD0iTTcuNjA2IDE4SDRhMiAyIDAgMCAxLTItMlY4YTIgMiAwIDAgMSAyLTJoMy42MDYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/battery-plus
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const BatteryPlus = createLucideIcon('battery-plus', [["path",{"d":"M10 9v6"}],["path",{"d":"M12.543 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.605"}],["path",{"d":"M22 14v-4"}],["path",{"d":"M7 12h6"}],["path",{"d":"M7.606 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.606"}]]) as AstroComponent;

export default BatteryPlus;
