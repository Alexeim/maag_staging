
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CloudOff
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMiAyIDIwIDIwIiAvPgogIDxwYXRoIGQ9Ik01Ljc4MiA1Ljc4MkE3IDcgMCAwIDAgOSAxOWg4LjVhNC41IDQuNSAwIDAgMCAxLjMwNy0uMTkzIiAvPgogIDxwYXRoIGQ9Ik0yMS41MzIgMTYuNUE0LjUgNC41IDAgMCAwIDE3LjUgMTBoLTEuNzlBNy4wMDggNy4wMDggMCAwIDAgMTAgNS4wNyIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/cloud-off
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CloudOff = createLucideIcon('cloud-off', [["path",{"d":"m2 2 20 20"}],["path",{"d":"M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"}],["path",{"d":"M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07"}]]) as AstroComponent;

export default CloudOff;
