
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CornerLeftUp
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTQgOSA5IDQgNCA5IiAvPgogIDxwYXRoIGQ9Ik0yMCAyMGgtN2E0IDQgMCAwIDEtNC00VjQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/corner-left-up
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CornerLeftUp = createLucideIcon('corner-left-up', [["path",{"d":"M14 9 9 4 4 9"}],["path",{"d":"M20 20h-7a4 4 0 0 1-4-4V4"}]]) as AstroComponent;

export default CornerLeftUp;
