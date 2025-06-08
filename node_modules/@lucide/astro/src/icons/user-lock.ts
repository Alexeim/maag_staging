
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name UserLock
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjciIHI9IjQiIC8+CiAgPHBhdGggZD0iTTEwLjMgMTVIN2E0IDQgMCAwIDAtNCA0djIiIC8+CiAgPHBhdGggZD0iTTE1IDE1LjVWMTRhMiAyIDAgMCAxIDQgMHYxLjUiIC8+CiAgPHJlY3Qgd2lkdGg9IjgiIGhlaWdodD0iNSIgeD0iMTMiIHk9IjE2IiByeD0iLjg5OSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/user-lock
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const UserLock = createLucideIcon('user-lock', [["circle",{"cx":"10","cy":"7","r":"4"}],["path",{"d":"M10.3 15H7a4 4 0 0 0-4 4v2"}],["path",{"d":"M15 15.5V14a2 2 0 0 1 4 0v1.5"}],["rect",{"width":"8","height":"5","x":"13","y":"16","rx":".899"}]]) as AstroComponent;

export default UserLock;
