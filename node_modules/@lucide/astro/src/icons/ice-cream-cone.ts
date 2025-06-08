
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name IceCreamCone
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtNyAxMSA0LjA4IDEwLjM1YTEgMSAwIDAgMCAxLjg0IDBMMTcgMTEiIC8+CiAgPHBhdGggZD0iTTE3IDdBNSA1IDAgMCAwIDcgNyIgLz4KICA8cGF0aCBkPSJNMTcgN2EyIDIgMCAwIDEgMCA0SDdhMiAyIDAgMCAxIDAtNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/ice-cream-cone
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const IceCreamCone = createLucideIcon('ice-cream-cone', [["path",{"d":"m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11"}],["path",{"d":"M17 7A5 5 0 0 0 7 7"}],["path",{"d":"M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4"}]]) as AstroComponent;

export default IceCreamCone;
