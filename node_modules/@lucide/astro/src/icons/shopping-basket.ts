
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ShoppingBasket
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTUgMTEtMSA5IiAvPgogIDxwYXRoIGQ9Im0xOSAxMS00LTciIC8+CiAgPHBhdGggZD0iTTIgMTFoMjAiIC8+CiAgPHBhdGggZD0ibTMuNSAxMSAxLjYgNy40YTIgMiAwIDAgMCAyIDEuNmg5LjhhMiAyIDAgMCAwIDItMS42bDEuNy03LjQiIC8+CiAgPHBhdGggZD0iTTQuNSAxNS41aDE1IiAvPgogIDxwYXRoIGQ9Im01IDExIDQtNyIgLz4KICA8cGF0aCBkPSJtOSAxMSAxIDkiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/shopping-basket
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ShoppingBasket = createLucideIcon('shopping-basket', [["path",{"d":"m15 11-1 9"}],["path",{"d":"m19 11-4-7"}],["path",{"d":"M2 11h20"}],["path",{"d":"m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"}],["path",{"d":"M4.5 15.5h15"}],["path",{"d":"m5 11 4-7"}],["path",{"d":"m9 11 1 9"}]]) as AstroComponent;

export default ShoppingBasket;
