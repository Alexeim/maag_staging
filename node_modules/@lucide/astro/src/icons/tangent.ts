
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Tangent
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxNyIgY3k9IjQiIHI9IjIiIC8+CiAgPHBhdGggZD0iTTE1LjU5IDUuNDEgNS40MSAxNS41OSIgLz4KICA8Y2lyY2xlIGN4PSI0IiBjeT0iMTciIHI9IjIiIC8+CiAgPHBhdGggZD0iTTEyIDIycy00LTktMS41LTExLjVTMjIgMTIgMjIgMTIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/tangent
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Tangent = createLucideIcon('tangent', [["circle",{"cx":"17","cy":"4","r":"2"}],["path",{"d":"M15.59 5.41 5.41 15.59"}],["circle",{"cx":"4","cy":"17","r":"2"}],["path",{"d":"M12 22s-4-9-1.5-11.5S22 12 22 12"}]]) as AstroComponent;

export default Tangent;
