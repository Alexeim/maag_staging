
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Link2Off
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOSAxN0g3QTUgNSAwIDAgMSA3IDciIC8+CiAgPHBhdGggZD0iTTE1IDdoMmE1IDUgMCAwIDEgNCA4IiAvPgogIDxsaW5lIHgxPSI4IiB4Mj0iMTIiIHkxPSIxMiIgeTI9IjEyIiAvPgogIDxsaW5lIHgxPSIyIiB4Mj0iMjIiIHkxPSIyIiB5Mj0iMjIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/link-2-off
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Link2Off = createLucideIcon('link-2-off', [["path",{"d":"M9 17H7A5 5 0 0 1 7 7"}],["path",{"d":"M15 7h2a5 5 0 0 1 4 8"}],["line",{"x1":"8","x2":"12","y1":"12","y2":"12"}],["line",{"x1":"2","x2":"22","y1":"2","y2":"22"}]]) as AstroComponent;

export default Link2Off;
