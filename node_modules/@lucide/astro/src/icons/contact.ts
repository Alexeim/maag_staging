
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Contact
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTYgMnYyIiAvPgogIDxwYXRoIGQ9Ik03IDIydi0yYTIgMiAwIDAgMSAyLTJoNmEyIDIgMCAwIDEgMiAydjIiIC8+CiAgPHBhdGggZD0iTTggMnYyIiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTEiIHI9IjMiIC8+CiAgPHJlY3QgeD0iMyIgeT0iNCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/contact
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Contact = createLucideIcon('contact', [["path",{"d":"M16 2v2"}],["path",{"d":"M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"}],["path",{"d":"M8 2v2"}],["circle",{"cx":"12","cy":"11","r":"3"}],["rect",{"x":"3","y":"4","width":"18","height":"18","rx":"2"}]]) as AstroComponent;

export default Contact;
