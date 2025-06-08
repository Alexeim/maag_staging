
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name SignpostBig
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgOUg0TDIgN2wyLTJoNiIgLz4KICA8cGF0aCBkPSJNMTQgNWg2bDIgMi0yIDJoLTYiIC8+CiAgPHBhdGggZD0iTTEwIDIyVjRhMiAyIDAgMSAxIDQgMHYxOCIgLz4KICA8cGF0aCBkPSJNOCAyMmg4IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/signpost-big
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const SignpostBig = createLucideIcon('signpost-big', [["path",{"d":"M10 9H4L2 7l2-2h6"}],["path",{"d":"M14 5h6l2 2-2 2h-6"}],["path",{"d":"M10 22V4a2 2 0 1 1 4 0v18"}],["path",{"d":"M8 22h8"}]]) as AstroComponent;

export default SignpostBig;
