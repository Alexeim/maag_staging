
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name RotateCcwSquare
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgOVY3YTIgMiAwIDAgMC0yLTJoLTYiIC8+CiAgPHBhdGggZD0ibTE1IDItMyAzIDMgMyIgLz4KICA8cGF0aCBkPSJNMjAgMTN2NWEyIDIgMCAwIDEtMiAySDZhMiAyIDAgMCAxLTItMlY3YTIgMiAwIDAgMSAyLTJoMiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/rotate-ccw-square
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const RotateCcwSquare = createLucideIcon('rotate-ccw-square', [["path",{"d":"M20 9V7a2 2 0 0 0-2-2h-6"}],["path",{"d":"m15 2-3 3 3 3"}],["path",{"d":"M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"}]]) as AstroComponent;

export default RotateCcwSquare;
