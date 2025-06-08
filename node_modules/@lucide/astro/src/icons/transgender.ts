
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Transgender
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTZ2NiIgLz4KICA8cGF0aCBkPSJNMTQgMjBoLTQiIC8+CiAgPHBhdGggZD0iTTE4IDJoNHY0IiAvPgogIDxwYXRoIGQ9Im0yIDIgNy4xNyA3LjE3IiAvPgogIDxwYXRoIGQ9Ik0yIDUuMzU1VjJoMy4zNTciIC8+CiAgPHBhdGggZD0ibTIyIDItNy4xNyA3LjE3IiAvPgogIDxwYXRoIGQ9Ik04IDUgNSA4IiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/transgender
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Transgender = createLucideIcon('transgender', [["path",{"d":"M12 16v6"}],["path",{"d":"M14 20h-4"}],["path",{"d":"M18 2h4v4"}],["path",{"d":"m2 2 7.17 7.17"}],["path",{"d":"M2 5.355V2h3.357"}],["path",{"d":"m22 2-7.17 7.17"}],["path",{"d":"M8 5 5 8"}],["circle",{"cx":"12","cy":"12","r":"4"}]]) as AstroComponent;

export default Transgender;
