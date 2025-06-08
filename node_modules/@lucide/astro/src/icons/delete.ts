
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Delete
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgNWEyIDIgMCAwIDAtMS4zNDQuNTE5bC02LjMyOCA1Ljc0YTEgMSAwIDAgMCAwIDEuNDgxbDYuMzI4IDUuNzQxQTIgMiAwIDAgMCAxMCAxOWgxMGEyIDIgMCAwIDAgMi0yVjdhMiAyIDAgMCAwLTItMnoiIC8+CiAgPHBhdGggZD0ibTEyIDkgNiA2IiAvPgogIDxwYXRoIGQ9Im0xOCA5LTYgNiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/delete
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Delete = createLucideIcon('delete', [["path",{"d":"M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"}],["path",{"d":"m12 9 6 6"}],["path",{"d":"m18 9-6 6"}]]) as AstroComponent;

export default Delete;
