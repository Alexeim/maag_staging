
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name GitPullRequestDraft
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxOCIgY3k9IjE4IiByPSIzIiAvPgogIDxjaXJjbGUgY3g9IjYiIGN5PSI2IiByPSIzIiAvPgogIDxwYXRoIGQ9Ik0xOCA2VjUiIC8+CiAgPHBhdGggZD0iTTE4IDExdi0xIiAvPgogIDxsaW5lIHgxPSI2IiB4Mj0iNiIgeTE9IjkiIHkyPSIyMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/git-pull-request-draft
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const GitPullRequestDraft = createLucideIcon('git-pull-request-draft', [["circle",{"cx":"18","cy":"18","r":"3"}],["circle",{"cx":"6","cy":"6","r":"3"}],["path",{"d":"M18 6V5"}],["path",{"d":"M18 11v-1"}],["line",{"x1":"6","x2":"6","y1":"9","y2":"21"}]]) as AstroComponent;

export default GitPullRequestDraft;
