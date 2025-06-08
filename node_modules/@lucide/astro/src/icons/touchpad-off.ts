
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name TouchpadOff
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMjB2LTYiIC8+CiAgPHBhdGggZD0iTTE5LjY1NiAxNEgyMiIgLz4KICA8cGF0aCBkPSJNMiAxNGgxMiIgLz4KICA8cGF0aCBkPSJtMiAyIDIwIDIwIiAvPgogIDxwYXRoIGQ9Ik0yMCAyMEg0YTIgMiAwIDAgMS0yLTJWNmEyIDIgMCAwIDEgMi0yIiAvPgogIDxwYXRoIGQ9Ik05LjY1NiA0SDIwYTIgMiAwIDAgMSAyIDJ2MTAuMzQ0IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/touchpad-off
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const TouchpadOff = createLucideIcon('touchpad-off', [["path",{"d":"M12 20v-6"}],["path",{"d":"M19.656 14H22"}],["path",{"d":"M2 14h12"}],["path",{"d":"m2 2 20 20"}],["path",{"d":"M20 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2"}],["path",{"d":"M9.656 4H20a2 2 0 0 1 2 2v10.344"}]]) as AstroComponent;

export default TouchpadOff;
