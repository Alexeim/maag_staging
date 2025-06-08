
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name BatteryWarning
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgMTdoLjAxIiAvPgogIDxwYXRoIGQ9Ik0xMCA3djYiIC8+CiAgPHBhdGggZD0iTTE0IDZoMmEyIDIgMCAwIDEgMiAydjhhMiAyIDAgMCAxLTIgMmgtMiIgLz4KICA8cGF0aCBkPSJNMjIgMTR2LTQiIC8+CiAgPHBhdGggZD0iTTYgMThINGEyIDIgMCAwIDEtMi0yVjhhMiAyIDAgMCAxIDItMmgyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/battery-warning
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const BatteryWarning = createLucideIcon('battery-warning', [["path",{"d":"M10 17h.01"}],["path",{"d":"M10 7v6"}],["path",{"d":"M14 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"}],["path",{"d":"M22 14v-4"}],["path",{"d":"M6 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"}]]) as AstroComponent;

export default BatteryWarning;
