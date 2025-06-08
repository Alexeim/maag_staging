
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name MapPinMinus
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTguOTc3IDE0QzE5LjYgMTIuNzAxIDIwIDExLjM0MyAyMCAxMGE4IDggMCAwIDAtMTYgMGMwIDQuOTkzIDUuNTM5IDEwLjE5MyA3LjM5OSAxMS43OTlhMSAxIDAgMCAwIDEuMjAyIDAgMzIgMzIgMCAwIDAgLjgyNC0uNzM4IiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiIC8+CiAgPHBhdGggZD0iTTE2IDE4aDYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/map-pin-minus
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const MapPinMinus = createLucideIcon('map-pin-minus', [["path",{"d":"M18.977 14C19.6 12.701 20 11.343 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32 32 0 0 0 .824-.738"}],["circle",{"cx":"12","cy":"10","r":"3"}],["path",{"d":"M16 18h6"}]]) as AstroComponent;

export default MapPinMinus;
