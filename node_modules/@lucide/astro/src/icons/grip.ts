
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Grip
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjUiIHI9IjEiIC8+CiAgPGNpcmNsZSBjeD0iMTkiIGN5PSI1IiByPSIxIiAvPgogIDxjaXJjbGUgY3g9IjUiIGN5PSI1IiByPSIxIiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEiIC8+CiAgPGNpcmNsZSBjeD0iMTkiIGN5PSIxMiIgcj0iMSIgLz4KICA8Y2lyY2xlIGN4PSI1IiBjeT0iMTIiIHI9IjEiIC8+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxOSIgcj0iMSIgLz4KICA8Y2lyY2xlIGN4PSIxOSIgY3k9IjE5IiByPSIxIiAvPgogIDxjaXJjbGUgY3g9IjUiIGN5PSIxOSIgcj0iMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/grip
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Grip = createLucideIcon('grip', [["circle",{"cx":"12","cy":"5","r":"1"}],["circle",{"cx":"19","cy":"5","r":"1"}],["circle",{"cx":"5","cy":"5","r":"1"}],["circle",{"cx":"12","cy":"12","r":"1"}],["circle",{"cx":"19","cy":"12","r":"1"}],["circle",{"cx":"5","cy":"12","r":"1"}],["circle",{"cx":"12","cy":"19","r":"1"}],["circle",{"cx":"19","cy":"19","r":"1"}],["circle",{"cx":"5","cy":"19","r":"1"}]]) as AstroComponent;

export default Grip;
