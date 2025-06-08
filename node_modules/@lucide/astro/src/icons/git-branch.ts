
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name GitBranch
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8bGluZSB4MT0iNiIgeDI9IjYiIHkxPSIzIiB5Mj0iMTUiIC8+CiAgPGNpcmNsZSBjeD0iMTgiIGN5PSI2IiByPSIzIiAvPgogIDxjaXJjbGUgY3g9IjYiIGN5PSIxOCIgcj0iMyIgLz4KICA8cGF0aCBkPSJNMTggOWE5IDkgMCAwIDEtOSA5IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/git-branch
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const GitBranch = createLucideIcon('git-branch', [["line",{"x1":"6","x2":"6","y1":"3","y2":"15"}],["circle",{"cx":"18","cy":"6","r":"3"}],["circle",{"cx":"6","cy":"18","r":"3"}],["path",{"d":"M18 9a9 9 0 0 1-9 9"}]]) as AstroComponent;

export default GitBranch;
