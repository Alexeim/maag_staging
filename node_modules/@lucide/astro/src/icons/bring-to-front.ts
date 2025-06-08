
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name BringToFront
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB4PSI4IiB5PSI4IiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiByeD0iMiIgLz4KICA8cGF0aCBkPSJNNCAxMGEyIDIgMCAwIDEtMi0yVjRhMiAyIDAgMCAxIDItMmg0YTIgMiAwIDAgMSAyIDIiIC8+CiAgPHBhdGggZD0iTTE0IDIwYTIgMiAwIDAgMCAyIDJoNGEyIDIgMCAwIDAgMi0ydi00YTIgMiAwIDAgMC0yLTIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/bring-to-front
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const BringToFront = createLucideIcon('bring-to-front', [["rect",{"x":"8","y":"8","width":"8","height":"8","rx":"2"}],["path",{"d":"M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2"}],["path",{"d":"M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2"}]]) as AstroComponent;

export default BringToFront;
