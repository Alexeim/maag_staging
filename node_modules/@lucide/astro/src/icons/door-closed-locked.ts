
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name DoorClosedLocked
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgMTJoLjAxIiAvPgogIDxwYXRoIGQ9Ik0xOCA5VjZhMiAyIDAgMCAwLTItMkg4YTIgMiAwIDAgMC0yIDJ2MTQiIC8+CiAgPHBhdGggZD0iTTIgMjBoOCIgLz4KICA8cGF0aCBkPSJNMjAgMTd2LTJhMiAyIDAgMSAwLTQgMHYyIiAvPgogIDxyZWN0IHg9IjE0IiB5PSIxNyIgd2lkdGg9IjgiIGhlaWdodD0iNSIgcng9IjEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/door-closed-locked
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const DoorClosedLocked = createLucideIcon('door-closed-locked', [["path",{"d":"M10 12h.01"}],["path",{"d":"M18 9V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"}],["path",{"d":"M2 20h8"}],["path",{"d":"M20 17v-2a2 2 0 1 0-4 0v2"}],["rect",{"x":"14","y":"17","width":"8","height":"5","rx":"1"}]]) as AstroComponent;

export default DoorClosedLocked;
