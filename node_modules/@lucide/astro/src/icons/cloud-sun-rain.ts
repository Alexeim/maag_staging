
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CloudSunRain
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMnYyIiAvPgogIDxwYXRoIGQ9Im00LjkzIDQuOTMgMS40MSAxLjQxIiAvPgogIDxwYXRoIGQ9Ik0yMCAxMmgyIiAvPgogIDxwYXRoIGQ9Im0xOS4wNyA0LjkzLTEuNDEgMS40MSIgLz4KICA8cGF0aCBkPSJNMTUuOTQ3IDEyLjY1YTQgNCAwIDAgMC01LjkyNS00LjEyOCIgLz4KICA8cGF0aCBkPSJNMyAyMGE1IDUgMCAxIDEgOC45LTRIMTNhMyAzIDAgMCAxIDIgNS4yNCIgLz4KICA8cGF0aCBkPSJNMTEgMjB2MiIgLz4KICA8cGF0aCBkPSJNNyAxOXYyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/cloud-sun-rain
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CloudSunRain = createLucideIcon('cloud-sun-rain', [["path",{"d":"M12 2v2"}],["path",{"d":"m4.93 4.93 1.41 1.41"}],["path",{"d":"M20 12h2"}],["path",{"d":"m19.07 4.93-1.41 1.41"}],["path",{"d":"M15.947 12.65a4 4 0 0 0-5.925-4.128"}],["path",{"d":"M3 20a5 5 0 1 1 8.9-4H13a3 3 0 0 1 2 5.24"}],["path",{"d":"M11 20v2"}],["path",{"d":"M7 19v2"}]]) as AstroComponent;

export default CloudSunRain;
