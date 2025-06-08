
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Joystick
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEgMTdhMiAyIDAgMCAwLTItMkg1YTIgMiAwIDAgMC0yIDJ2MmEyIDIgMCAwIDAgMiAyaDE0YTIgMiAwIDAgMCAyLTJ2LTJaIiAvPgogIDxwYXRoIGQ9Ik02IDE1di0yIiAvPgogIDxwYXRoIGQ9Ik0xMiAxNVY5IiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iNiIgcj0iMyIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/joystick
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Joystick = createLucideIcon('joystick', [["path",{"d":"M21 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2Z"}],["path",{"d":"M6 15v-2"}],["path",{"d":"M12 15V9"}],["circle",{"cx":"12","cy":"6","r":"3"}]]) as AstroComponent;

export default Joystick;
