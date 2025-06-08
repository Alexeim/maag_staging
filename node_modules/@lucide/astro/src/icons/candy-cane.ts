
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CandyCane
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNS43IDIxYTIgMiAwIDAgMS0zLjUtMmw4LjYtMTRhNiA2IDAgMCAxIDEwLjQgNiAyIDIgMCAxIDEtMy40NjQtMiAyIDIgMCAxIDAtMy40NjQtMloiIC8+CiAgPHBhdGggZD0iTTE3Ljc1IDcgMTUgMi4xIiAvPgogIDxwYXRoIGQ9Ik0xMC45IDQuOCAxMyA5IiAvPgogIDxwYXRoIGQ9Im03LjkgOS43IDIgNC40IiAvPgogIDxwYXRoIGQ9Ik00LjkgMTQuNyA3IDE4LjkiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/candy-cane
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CandyCane = createLucideIcon('candy-cane', [["path",{"d":"M5.7 21a2 2 0 0 1-3.5-2l8.6-14a6 6 0 0 1 10.4 6 2 2 0 1 1-3.464-2 2 2 0 1 0-3.464-2Z"}],["path",{"d":"M17.75 7 15 2.1"}],["path",{"d":"M10.9 4.8 13 9"}],["path",{"d":"m7.9 9.7 2 4.4"}],["path",{"d":"M4.9 14.7 7 18.9"}]]) as AstroComponent;

export default CandyCane;
