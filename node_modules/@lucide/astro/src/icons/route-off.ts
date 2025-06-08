
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name RouteOff
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSI2IiBjeT0iMTkiIHI9IjMiIC8+CiAgPHBhdGggZD0iTTkgMTloOC41Yy40IDAgLjktLjEgMS4zLS4yIiAvPgogIDxwYXRoIGQ9Ik01LjIgNS4yQTMuNSAzLjUzIDAgMCAwIDYuNSAxMkgxMiIgLz4KICA8cGF0aCBkPSJtMiAyIDIwIDIwIiAvPgogIDxwYXRoIGQ9Ik0yMSAxNS4zYTMuNSAzLjUgMCAwIDAtMy4zLTMuMyIgLz4KICA8cGF0aCBkPSJNMTUgNWgtNC4zIiAvPgogIDxjaXJjbGUgY3g9IjE4IiBjeT0iNSIgcj0iMyIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/route-off
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const RouteOff = createLucideIcon('route-off', [["circle",{"cx":"6","cy":"19","r":"3"}],["path",{"d":"M9 19h8.5c.4 0 .9-.1 1.3-.2"}],["path",{"d":"M5.2 5.2A3.5 3.53 0 0 0 6.5 12H12"}],["path",{"d":"m2 2 20 20"}],["path",{"d":"M21 15.3a3.5 3.5 0 0 0-3.3-3.3"}],["path",{"d":"M15 5h-4.3"}],["circle",{"cx":"18","cy":"5","r":"3"}]]) as AstroComponent;

export default RouteOff;
