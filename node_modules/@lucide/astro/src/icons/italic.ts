
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Italic
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8bGluZSB4MT0iMTkiIHgyPSIxMCIgeTE9IjQiIHkyPSI0IiAvPgogIDxsaW5lIHgxPSIxNCIgeDI9IjUiIHkxPSIyMCIgeTI9IjIwIiAvPgogIDxsaW5lIHgxPSIxNSIgeDI9IjkiIHkxPSI0IiB5Mj0iMjAiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/italic
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Italic = createLucideIcon('italic', [["line",{"x1":"19","x2":"10","y1":"4","y2":"4"}],["line",{"x1":"14","x2":"5","y1":"20","y2":"20"}],["line",{"x1":"15","x2":"9","y1":"4","y2":"20"}]]) as AstroComponent;

export default Italic;
