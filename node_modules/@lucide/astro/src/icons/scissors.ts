
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Scissors
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSI2IiBjeT0iNiIgcj0iMyIgLz4KICA8cGF0aCBkPSJNOC4xMiA4LjEyIDEyIDEyIiAvPgogIDxwYXRoIGQ9Ik0yMCA0IDguMTIgMTUuODgiIC8+CiAgPGNpcmNsZSBjeD0iNiIgY3k9IjE4IiByPSIzIiAvPgogIDxwYXRoIGQ9Ik0xNC44IDE0LjggMjAgMjAiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/scissors
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Scissors = createLucideIcon('scissors', [["circle",{"cx":"6","cy":"6","r":"3"}],["path",{"d":"M8.12 8.12 12 12"}],["path",{"d":"M20 4 8.12 15.88"}],["circle",{"cx":"6","cy":"18","r":"3"}],["path",{"d":"M14.8 14.8 20 20"}]]) as AstroComponent;

export default Scissors;
