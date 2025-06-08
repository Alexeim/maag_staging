
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Earth
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEuNTQgMTVIMTdhMiAyIDAgMCAwLTIgMnY0LjU0IiAvPgogIDxwYXRoIGQ9Ik03IDMuMzRWNWEzIDMgMCAwIDAgMyAzYTIgMiAwIDAgMSAyIDJjMCAxLjEuOSAyIDIgMmEyIDIgMCAwIDAgMi0yYzAtMS4xLjktMiAyLTJoMy4xNyIgLz4KICA8cGF0aCBkPSJNMTEgMjEuOTVWMThhMiAyIDAgMCAwLTItMmEyIDIgMCAwIDEtMi0ydi0xYTIgMiAwIDAgMC0yLTJIMi4wNSIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/earth
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Earth = createLucideIcon('earth', [["path",{"d":"M21.54 15H17a2 2 0 0 0-2 2v4.54"}],["path",{"d":"M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"}],["path",{"d":"M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"}],["circle",{"cx":"12","cy":"12","r":"10"}]]) as AstroComponent;

export default Earth;
