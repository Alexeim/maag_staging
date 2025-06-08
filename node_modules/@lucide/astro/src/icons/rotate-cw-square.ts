
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name RotateCwSquare
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgNUg2YTIgMiAwIDAgMC0yIDJ2MyIgLz4KICA8cGF0aCBkPSJtOSA4IDMtMy0zLTMiIC8+CiAgPHBhdGggZD0iTTQgMTR2NGEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJWN2EyIDIgMCAwIDAtMi0yaC0yIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/rotate-cw-square
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const RotateCwSquare = createLucideIcon('rotate-cw-square', [["path",{"d":"M12 5H6a2 2 0 0 0-2 2v3"}],["path",{"d":"m9 8 3-3-3-3"}],["path",{"d":"M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"}]]) as AstroComponent;

export default RotateCwSquare;
