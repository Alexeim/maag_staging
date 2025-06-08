
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name WavesLadder
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTkgNWEyIDIgMCAwIDAtMiAydjExIiAvPgogIDxwYXRoIGQ9Ik0yIDE4Yy42LjUgMS4yIDEgMi41IDEgMi41IDAgMi41LTIgNS0yIDIuNiAwIDIuNCAyIDUgMiAyLjUgMCAyLjUtMiA1LTIgMS4zIDAgMS45LjUgMi41IDEiIC8+CiAgPHBhdGggZD0iTTcgMTNoMTAiIC8+CiAgPHBhdGggZD0iTTcgOWgxMCIgLz4KICA8cGF0aCBkPSJNOSA1YTIgMiAwIDAgMC0yIDJ2MTEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/waves-ladder
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const WavesLadder = createLucideIcon('waves-ladder', [["path",{"d":"M19 5a2 2 0 0 0-2 2v11"}],["path",{"d":"M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"}],["path",{"d":"M7 13h10"}],["path",{"d":"M7 9h10"}],["path",{"d":"M9 5a2 2 0 0 0-2 2v11"}]]) as AstroComponent;

export default WavesLadder;
