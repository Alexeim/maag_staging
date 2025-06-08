
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name SquareSplitHorizontal
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOCAxOUg1Yy0xIDAtMi0xLTItMlY3YzAtMSAxLTIgMi0yaDMiIC8+CiAgPHBhdGggZD0iTTE2IDVoM2MxIDAgMiAxIDIgMnYxMGMwIDEtMSAyLTIgMmgtMyIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIxMiIgeTE9IjQiIHkyPSIyMCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/square-split-horizontal
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const SquareSplitHorizontal = createLucideIcon('square-split-horizontal', [["path",{"d":"M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3"}],["path",{"d":"M16 5h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3"}],["line",{"x1":"12","x2":"12","y1":"4","y2":"20"}]]) as AstroComponent;

export default SquareSplitHorizontal;
