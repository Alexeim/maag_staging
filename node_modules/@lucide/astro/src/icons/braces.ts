
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Braces
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOCAzSDdhMiAyIDAgMCAwLTIgMnY1YTIgMiAwIDAgMS0yIDIgMiAyIDAgMCAxIDIgMnY1YzAgMS4xLjkgMiAyIDJoMSIgLz4KICA8cGF0aCBkPSJNMTYgMjFoMWEyIDIgMCAwIDAgMi0ydi01YzAtMS4xLjktMiAyLTJhMiAyIDAgMCAxLTItMlY1YTIgMiAwIDAgMC0yLTJoLTEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/braces
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Braces = createLucideIcon('braces', [["path",{"d":"M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"}],["path",{"d":"M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"}]]) as AstroComponent;

export default Braces;
