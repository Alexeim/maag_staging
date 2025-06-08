
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CableCar
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgM2guMDEiIC8+CiAgPHBhdGggZD0iTTE0IDJoLjAxIiAvPgogIDxwYXRoIGQ9Im0yIDkgMjAtNSIgLz4KICA8cGF0aCBkPSJNMTIgMTJWNi41IiAvPgogIDxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxMCIgeD0iNCIgeT0iMTIiIHJ4PSIzIiAvPgogIDxwYXRoIGQ9Ik05IDEydjUiIC8+CiAgPHBhdGggZD0iTTE1IDEydjUiIC8+CiAgPHBhdGggZD0iTTQgMTdoMTYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/cable-car
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CableCar = createLucideIcon('cable-car', [["path",{"d":"M10 3h.01"}],["path",{"d":"M14 2h.01"}],["path",{"d":"m2 9 20-5"}],["path",{"d":"M12 12V6.5"}],["rect",{"width":"16","height":"10","x":"4","y":"12","rx":"3"}],["path",{"d":"M9 12v5"}],["path",{"d":"M15 12v5"}],["path",{"d":"M4 17h16"}]]) as AstroComponent;

export default CableCar;
