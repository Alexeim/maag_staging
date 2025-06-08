
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Figma
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNSA1LjVBMy41IDMuNSAwIDAgMSA4LjUgMkgxMnY3SDguNUEzLjUgMy41IDAgMCAxIDUgNS41eiIgLz4KICA8cGF0aCBkPSJNMTIgMmgzLjVhMy41IDMuNSAwIDEgMSAwIDdIMTJWMnoiIC8+CiAgPHBhdGggZD0iTTEyIDEyLjVhMy41IDMuNSAwIDEgMSA3IDAgMy41IDMuNSAwIDEgMS03IDB6IiAvPgogIDxwYXRoIGQ9Ik01IDE5LjVBMy41IDMuNSAwIDAgMSA4LjUgMTZIMTJ2My41YTMuNSAzLjUgMCAxIDEtNyAweiIgLz4KICA8cGF0aCBkPSJNNSAxMi41QTMuNSAzLjUgMCAwIDEgOC41IDlIMTJ2N0g4LjVBMy41IDMuNSAwIDAgMSA1IDEyLjV6IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/figma
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * @deprecated Brand icons have been deprecated and are due to be removed, please refer to https://github.com/lucide-icons/lucide/issues/670. We recommend using https://simpleicons.org/?q=figma instead. This icon will be removed in v1.0
 */
const Figma = createLucideIcon('figma', [["path",{"d":"M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"}],["path",{"d":"M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"}],["path",{"d":"M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"}],["path",{"d":"M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"}],["path",{"d":"M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"}]]) as AstroComponent;

export default Figma;
