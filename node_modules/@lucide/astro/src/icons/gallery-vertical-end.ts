
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name GalleryVerticalEnd
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNyAyaDEwIiAvPgogIDxwYXRoIGQ9Ik01IDZoMTQiIC8+CiAgPHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjEyIiB4PSIzIiB5PSIxMCIgcng9IjIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/gallery-vertical-end
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const GalleryVerticalEnd = createLucideIcon('gallery-vertical-end', [["path",{"d":"M7 2h10"}],["path",{"d":"M5 6h14"}],["rect",{"width":"18","height":"12","x":"3","y":"10","rx":"2"}]]) as AstroComponent;

export default GalleryVerticalEnd;
