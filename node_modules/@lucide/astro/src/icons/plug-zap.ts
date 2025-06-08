
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name PlugZap
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNi4zIDIwLjNhMi40IDIuNCAwIDAgMCAzLjQgMEwxMiAxOGwtNi02LTIuMyAyLjNhMi40IDIuNCAwIDAgMCAwIDMuNFoiIC8+CiAgPHBhdGggZD0ibTIgMjIgMy0zIiAvPgogIDxwYXRoIGQ9Ik03LjUgMTMuNSAxMCAxMSIgLz4KICA8cGF0aCBkPSJNMTAuNSAxNi41IDEzIDE0IiAvPgogIDxwYXRoIGQ9Im0xOCAzLTQgNGg2bC00IDQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/plug-zap
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const PlugZap = createLucideIcon('plug-zap', [["path",{"d":"M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"}],["path",{"d":"m2 22 3-3"}],["path",{"d":"M7.5 13.5 10 11"}],["path",{"d":"M10.5 16.5 13 14"}],["path",{"d":"m18 3-4 4h6l-4 4"}]]) as AstroComponent;

export default PlugZap;
