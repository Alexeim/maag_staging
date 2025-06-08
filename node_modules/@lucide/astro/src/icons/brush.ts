
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Brush
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTEgMTAgMyAzIiAvPgogIDxwYXRoIGQ9Ik02LjUgMjFBMy41IDMuNSAwIDEgMCAzIDE3LjVhMi42MiAyLjYyIDAgMCAxLS43MDggMS43OTJBMSAxIDAgMCAwIDMgMjF6IiAvPgogIDxwYXRoIGQ9Ik05Ljk2OSAxNy4wMzEgMjEuMzc4IDUuNjI0YTEgMSAwIDAgMC0zLjAwMi0zLjAwMkw2Ljk2NyAxNC4wMzEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/brush
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Brush = createLucideIcon('brush', [["path",{"d":"m11 10 3 3"}],["path",{"d":"M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z"}],["path",{"d":"M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031"}]]) as AstroComponent;

export default Brush;
