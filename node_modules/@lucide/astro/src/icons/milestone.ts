
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Milestone
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTN2OCIgLz4KICA8cGF0aCBkPSJNMTIgM3YzIiAvPgogIDxwYXRoIGQ9Ik00IDZhMSAxIDAgMCAwLTEgMXY1YTEgMSAwIDAgMCAxIDFoMTNhMiAyIDAgMCAwIDEuMTUyLS4zNjVsMy40MjQtMi4zMTdhMSAxIDAgMCAwIDAtMS42MzVsLTMuNDI0LTIuMzE4QTIgMiAwIDAgMCAxNyA2eiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/milestone
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Milestone = createLucideIcon('milestone', [["path",{"d":"M12 13v8"}],["path",{"d":"M12 3v3"}],["path",{"d":"M4 6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h13a2 2 0 0 0 1.152-.365l3.424-2.317a1 1 0 0 0 0-1.635l-3.424-2.318A2 2 0 0 0 17 6z"}]]) as AstroComponent;

export default Milestone;
