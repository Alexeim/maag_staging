
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ClockPlus
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgNnY2bDMuNjQ0IDEuODIyIiAvPgogIDxwYXRoIGQ9Ik0xNiAxOWg2IiAvPgogIDxwYXRoIGQ9Ik0xOSAxNnY2IiAvPgogIDxwYXRoIGQ9Ik0yMS45MiAxMy4yNjdhMTAgMTAgMCAxIDAtOC42NTMgOC42NTMiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/clock-plus
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ClockPlus = createLucideIcon('clock-plus', [["path",{"d":"M12 6v6l3.644 1.822"}],["path",{"d":"M16 19h6"}],["path",{"d":"M19 16v6"}],["path",{"d":"M21.92 13.267a10 10 0 1 0-8.653 8.653"}]]) as AstroComponent;

export default ClockPlus;
