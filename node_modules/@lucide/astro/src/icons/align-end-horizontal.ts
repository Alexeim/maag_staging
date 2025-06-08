
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name AlignEndHorizontal
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iNiIgaGVpZ2h0PSIxNiIgeD0iNCIgeT0iMiIgcng9IjIiIC8+CiAgPHJlY3Qgd2lkdGg9IjYiIGhlaWdodD0iOSIgeD0iMTQiIHk9IjkiIHJ4PSIyIiAvPgogIDxwYXRoIGQ9Ik0yMiAyMkgyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/align-end-horizontal
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const AlignEndHorizontal = createLucideIcon('align-end-horizontal', [["rect",{"width":"6","height":"16","x":"4","y":"2","rx":"2"}],["rect",{"width":"6","height":"9","x":"14","y":"9","rx":"2"}],["path",{"d":"M22 22H2"}]]) as AstroComponent;

export default AlignEndHorizontal;
