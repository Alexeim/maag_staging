
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Wine
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOCAyMmg4IiAvPgogIDxwYXRoIGQ9Ik03IDEwaDEwIiAvPgogIDxwYXRoIGQ9Ik0xMiAxNXY3IiAvPgogIDxwYXRoIGQ9Ik0xMiAxNWE1IDUgMCAwIDAgNS01YzAtMi0uNS00LTItOEg5Yy0xLjUgNC0yIDYtMiA4YTUgNSAwIDAgMCA1IDVaIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/wine
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Wine = createLucideIcon('wine', [["path",{"d":"M8 22h8"}],["path",{"d":"M7 10h10"}],["path",{"d":"M12 15v7"}],["path",{"d":"M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"}]]) as AstroComponent;

export default Wine;
