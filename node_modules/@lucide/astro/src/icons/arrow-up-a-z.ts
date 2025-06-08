
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ArrowUpAZ
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMyA4IDQtNCA0IDQiIC8+CiAgPHBhdGggZD0iTTcgNHYxNiIgLz4KICA8cGF0aCBkPSJNMjAgOGgtNSIgLz4KICA8cGF0aCBkPSJNMTUgMTBWNi41YTIuNSAyLjUgMCAwIDEgNSAwVjEwIiAvPgogIDxwYXRoIGQ9Ik0xNSAxNGg1bC01IDZoNSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/arrow-up-a-z
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ArrowUpAZ = createLucideIcon('arrow-up-a-z', [["path",{"d":"m3 8 4-4 4 4"}],["path",{"d":"M7 4v16"}],["path",{"d":"M20 8h-5"}],["path",{"d":"M15 10V6.5a2.5 2.5 0 0 1 5 0V10"}],["path",{"d":"M15 14h5l-5 6h5"}]]) as AstroComponent;

export default ArrowUpAZ;
