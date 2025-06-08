
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name VibrateOff
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMiA4IDIgMi0yIDIgMiAyLTIgMiIgLz4KICA8cGF0aCBkPSJtMjIgOC0yIDIgMiAyLTIgMiAyIDIiIC8+CiAgPHBhdGggZD0iTTggOHYxMGMwIC41NS40NSAxIDEgMWg2Yy41NSAwIDEtLjQ1IDEtMXYtMiIgLz4KICA8cGF0aCBkPSJNMTYgMTAuMzRWNmMwLS41NS0uNDUtMS0xLTFoLTQuMzQiIC8+CiAgPGxpbmUgeDE9IjIiIHgyPSIyMiIgeTE9IjIiIHkyPSIyMiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/vibrate-off
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const VibrateOff = createLucideIcon('vibrate-off', [["path",{"d":"m2 8 2 2-2 2 2 2-2 2"}],["path",{"d":"m22 8-2 2 2 2-2 2 2 2"}],["path",{"d":"M8 8v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2"}],["path",{"d":"M16 10.34V6c0-.55-.45-1-1-1h-4.34"}],["line",{"x1":"2","x2":"22","y1":"2","y2":"22"}]]) as AstroComponent;

export default VibrateOff;
