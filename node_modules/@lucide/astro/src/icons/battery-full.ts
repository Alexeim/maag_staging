
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name BatteryFull
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgMTB2NCIgLz4KICA8cGF0aCBkPSJNMTQgMTB2NCIgLz4KICA8cGF0aCBkPSJNMjIgMTR2LTQiIC8+CiAgPHBhdGggZD0iTTYgMTB2NCIgLz4KICA8cmVjdCB4PSIyIiB5PSI2IiB3aWR0aD0iMTYiIGhlaWdodD0iMTIiIHJ4PSIyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/battery-full
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const BatteryFull = createLucideIcon('battery-full', [["path",{"d":"M10 10v4"}],["path",{"d":"M14 10v4"}],["path",{"d":"M22 14v-4"}],["path",{"d":"M6 10v4"}],["rect",{"x":"2","y":"6","width":"16","height":"12","rx":"2"}]]) as AstroComponent;

export default BatteryFull;
