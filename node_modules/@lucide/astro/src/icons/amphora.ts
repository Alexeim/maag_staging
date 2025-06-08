
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Amphora
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgMnY1LjYzMmMwIC40MjQtLjI3Mi43OTUtLjY1My45ODJBNiA2IDAgMCAwIDYgMTRjLjAwNiA0IDMgNyA1IDgiIC8+CiAgPHBhdGggZD0iTTEwIDVIOGEyIDIgMCAwIDAgMCA0aC42OCIgLz4KICA8cGF0aCBkPSJNMTQgMnY1LjYzMmMwIC40MjQuMjcyLjc5NS42NTIuOTgyQTYgNiAwIDAgMSAxOCAxNGMwIDQtMyA3LTUgOCIgLz4KICA8cGF0aCBkPSJNMTQgNWgyYTIgMiAwIDAgMSAwIDRoLS42OCIgLz4KICA8cGF0aCBkPSJNMTggMjJINiIgLz4KICA8cGF0aCBkPSJNOSAyaDYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/amphora
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Amphora = createLucideIcon('amphora', [["path",{"d":"M10 2v5.632c0 .424-.272.795-.653.982A6 6 0 0 0 6 14c.006 4 3 7 5 8"}],["path",{"d":"M10 5H8a2 2 0 0 0 0 4h.68"}],["path",{"d":"M14 2v5.632c0 .424.272.795.652.982A6 6 0 0 1 18 14c0 4-3 7-5 8"}],["path",{"d":"M14 5h2a2 2 0 0 1 0 4h-.68"}],["path",{"d":"M18 22H6"}],["path",{"d":"M9 2h6"}]]) as AstroComponent;

export default Amphora;
