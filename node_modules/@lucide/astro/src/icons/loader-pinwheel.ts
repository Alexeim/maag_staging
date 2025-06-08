
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name LoaderPinwheel
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjIgMTJhMSAxIDAgMCAxLTEwIDAgMSAxIDAgMCAwLTEwIDAiIC8+CiAgPHBhdGggZD0iTTcgMjAuN2ExIDEgMCAxIDEgNS04LjcgMSAxIDAgMSAwIDUtOC42IiAvPgogIDxwYXRoIGQ9Ik03IDMuM2ExIDEgMCAxIDEgNSA4LjYgMSAxIDAgMSAwIDUgOC42IiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/loader-pinwheel
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const LoaderPinwheel = createLucideIcon('loader-pinwheel', [["path",{"d":"M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0"}],["path",{"d":"M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6"}],["path",{"d":"M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6"}],["circle",{"cx":"12","cy":"12","r":"10"}]]) as AstroComponent;

export default LoaderPinwheel;
