
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Grid2x2Plus
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgM3YxN2ExIDEgMCAwIDEtMSAxSDVhMiAyIDAgMCAxLTItMlY1YTIgMiAwIDAgMSAyLTJoMTRhMiAyIDAgMCAxIDIgMnY2YTEgMSAwIDAgMS0xIDFIMyIgLz4KICA8cGF0aCBkPSJNMTYgMTloNiIgLz4KICA8cGF0aCBkPSJNMTkgMjJ2LTYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/grid-2x2-plus
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Grid2x2Plus = createLucideIcon('grid-2x2-plus', [["path",{"d":"M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3"}],["path",{"d":"M16 19h6"}],["path",{"d":"M19 22v-6"}]]) as AstroComponent;

export default Grid2x2Plus;
