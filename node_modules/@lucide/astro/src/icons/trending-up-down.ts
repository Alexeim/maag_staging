
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name TrendingUpDown
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTQuODI4IDE0LjgyOCAyMSAyMSIgLz4KICA8cGF0aCBkPSJNMjEgMTZ2NWgtNSIgLz4KICA8cGF0aCBkPSJtMjEgMy05IDktNC00LTYgNiIgLz4KICA8cGF0aCBkPSJNMjEgOFYzaC01IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/trending-up-down
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const TrendingUpDown = createLucideIcon('trending-up-down', [["path",{"d":"M14.828 14.828 21 21"}],["path",{"d":"M21 16v5h-5"}],["path",{"d":"m21 3-9 9-4-4-6 6"}],["path",{"d":"M21 8V3h-5"}]]) as AstroComponent;

export default TrendingUpDown;
