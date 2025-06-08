
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Cloudy
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTcuNSAyMUg5YTcgNyAwIDEgMSA2LjcxLTloMS43OWE0LjUgNC41IDAgMSAxIDAgOVoiIC8+CiAgPHBhdGggZD0iTTIyIDEwYTMgMyAwIDAgMC0zLTNoLTIuMjA3YTUuNTAyIDUuNTAyIDAgMCAwLTEwLjcwMi41IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/cloudy
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Cloudy = createLucideIcon('cloudy', [["path",{"d":"M17.5 21H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"}],["path",{"d":"M22 10a3 3 0 0 0-3-3h-2.207a5.502 5.502 0 0 0-10.702.5"}]]) as AstroComponent;

export default Cloudy;
