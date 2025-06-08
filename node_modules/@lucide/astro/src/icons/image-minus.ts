
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ImageMinus
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEgOXYxMGEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMlY1YTIgMiAwIDAgMSAyLTJoNyIgLz4KICA8bGluZSB4MT0iMTYiIHgyPSIyMiIgeTE9IjUiIHkyPSI1IiAvPgogIDxjaXJjbGUgY3g9IjkiIGN5PSI5IiByPSIyIiAvPgogIDxwYXRoIGQ9Im0yMSAxNS0zLjA4Ni0zLjA4NmEyIDIgMCAwIDAtMi44MjggMEw2IDIxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/image-minus
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ImageMinus = createLucideIcon('image-minus', [["path",{"d":"M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"}],["line",{"x1":"16","x2":"22","y1":"5","y2":"5"}],["circle",{"cx":"9","cy":"9","r":"2"}],["path",{"d":"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"}]]) as AstroComponent;

export default ImageMinus;
