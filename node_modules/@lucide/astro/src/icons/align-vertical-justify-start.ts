
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name AlignVerticalJustifyStart
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTQiIGhlaWdodD0iNiIgeD0iNSIgeT0iMTYiIHJ4PSIyIiAvPgogIDxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSI2IiB4PSI3IiB5PSI2IiByeD0iMiIgLz4KICA8cGF0aCBkPSJNMiAyaDIwIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/align-vertical-justify-start
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const AlignVerticalJustifyStart = createLucideIcon('align-vertical-justify-start', [["rect",{"width":"14","height":"6","x":"5","y":"16","rx":"2"}],["rect",{"width":"10","height":"6","x":"7","y":"6","rx":"2"}],["path",{"d":"M2 2h20"}]]) as AstroComponent;

export default AlignVerticalJustifyStart;
