
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ArrowDownZA
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMyAxNiA0IDQgNC00IiAvPgogIDxwYXRoIGQ9Ik03IDR2MTYiIC8+CiAgPHBhdGggZD0iTTE1IDRoNWwtNSA2aDUiIC8+CiAgPHBhdGggZD0iTTE1IDIwdi0zLjVhMi41IDIuNSAwIDAgMSA1IDBWMjAiIC8+CiAgPHBhdGggZD0iTTIwIDE4aC01IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/arrow-down-z-a
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ArrowDownZA = createLucideIcon('arrow-down-z-a', [["path",{"d":"m3 16 4 4 4-4"}],["path",{"d":"M7 4v16"}],["path",{"d":"M15 4h5l-5 6h5"}],["path",{"d":"M15 20v-3.5a2.5 2.5 0 0 1 5 0V20"}],["path",{"d":"M20 18h-5"}]]) as AstroComponent;

export default ArrowDownZA;
