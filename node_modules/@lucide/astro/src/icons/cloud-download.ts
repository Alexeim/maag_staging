
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CloudDownload
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTN2OGwtNC00IiAvPgogIDxwYXRoIGQ9Im0xMiAyMSA0LTQiIC8+CiAgPHBhdGggZD0iTTQuMzkzIDE1LjI2OUE3IDcgMCAxIDEgMTUuNzEgOGgxLjc5YTQuNSA0LjUgMCAwIDEgMi40MzYgOC4yODQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/cloud-download
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CloudDownload = createLucideIcon('cloud-download', [["path",{"d":"M12 13v8l-4-4"}],["path",{"d":"m12 21 4-4"}],["path",{"d":"M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284"}]]) as AstroComponent;

export default CloudDownload;
