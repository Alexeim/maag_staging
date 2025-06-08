
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ContactRound
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTYgMnYyIiAvPgogIDxwYXRoIGQ9Ik0xNy45MTUgMjJhNiA2IDAgMCAwLTEyIDAiIC8+CiAgPHBhdGggZD0iTTggMnYyIiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjQiIC8+CiAgPHJlY3QgeD0iMyIgeT0iNCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/contact-round
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ContactRound = createLucideIcon('contact-round', [["path",{"d":"M16 2v2"}],["path",{"d":"M17.915 22a6 6 0 0 0-12 0"}],["path",{"d":"M8 2v2"}],["circle",{"cx":"12","cy":"12","r":"4"}],["rect",{"x":"3","y":"4","width":"18","height":"18","rx":"2"}]]) as AstroComponent;

export default ContactRound;
