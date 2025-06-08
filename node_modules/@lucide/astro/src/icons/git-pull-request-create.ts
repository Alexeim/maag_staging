
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name GitPullRequestCreate
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSI2IiBjeT0iNiIgcj0iMyIgLz4KICA8cGF0aCBkPSJNNiA5djEyIiAvPgogIDxwYXRoIGQ9Ik0xMyA2aDNhMiAyIDAgMCAxIDIgMnYzIiAvPgogIDxwYXRoIGQ9Ik0xOCAxNXY2IiAvPgogIDxwYXRoIGQ9Ik0yMSAxOGgtNiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/git-pull-request-create
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const GitPullRequestCreate = createLucideIcon('git-pull-request-create', [["circle",{"cx":"6","cy":"6","r":"3"}],["path",{"d":"M6 9v12"}],["path",{"d":"M13 6h3a2 2 0 0 1 2 2v3"}],["path",{"d":"M18 15v6"}],["path",{"d":"M21 18h-6"}]]) as AstroComponent;

export default GitPullRequestCreate;
