
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Package
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTEgMjEuNzNhMiAyIDAgMCAwIDIgMGw3LTRBMiAyIDAgMCAwIDIxIDE2VjhhMiAyIDAgMCAwLTEtMS43M2wtNy00YTIgMiAwIDAgMC0yIDBsLTcgNEEyIDIgMCAwIDAgMyA4djhhMiAyIDAgMCAwIDEgMS43M3oiIC8+CiAgPHBhdGggZD0iTTEyIDIyVjEyIiAvPgogIDxwb2x5bGluZSBwb2ludHM9IjMuMjkgNyAxMiAxMiAyMC43MSA3IiAvPgogIDxwYXRoIGQ9Im03LjUgNC4yNyA5IDUuMTUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/package
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Package = createLucideIcon('package', [["path",{"d":"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"}],["path",{"d":"M12 22V12"}],["polyline",{"points":"3.29 7 12 12 20.71 7"}],["path",{"d":"m7.5 4.27 9 5.15"}]]) as AstroComponent;

export default Package;
