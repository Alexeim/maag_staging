
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name UnfoldHorizontal
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTYgMTJoNiIgLz4KICA8cGF0aCBkPSJNOCAxMkgyIiAvPgogIDxwYXRoIGQ9Ik0xMiAydjIiIC8+CiAgPHBhdGggZD0iTTEyIDh2MiIgLz4KICA8cGF0aCBkPSJNMTIgMTR2MiIgLz4KICA8cGF0aCBkPSJNMTIgMjB2MiIgLz4KICA8cGF0aCBkPSJtMTkgMTUgMy0zLTMtMyIgLz4KICA8cGF0aCBkPSJtNSA5LTMgMyAzIDMiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/unfold-horizontal
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const UnfoldHorizontal = createLucideIcon('unfold-horizontal', [["path",{"d":"M16 12h6"}],["path",{"d":"M8 12H2"}],["path",{"d":"M12 2v2"}],["path",{"d":"M12 8v2"}],["path",{"d":"M12 14v2"}],["path",{"d":"M12 20v2"}],["path",{"d":"m19 15 3-3-3-3"}],["path",{"d":"m5 9-3 3 3 3"}]]) as AstroComponent;

export default UnfoldHorizontal;
