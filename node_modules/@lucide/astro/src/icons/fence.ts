
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Fence
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCAzIDIgNXYxNWMwIC42LjQgMSAxIDFoMmMuNiAwIDEtLjQgMS0xVjVaIiAvPgogIDxwYXRoIGQ9Ik02IDhoNCIgLz4KICA8cGF0aCBkPSJNNiAxOGg0IiAvPgogIDxwYXRoIGQ9Im0xMiAzLTIgMnYxNWMwIC42LjQgMSAxIDFoMmMuNiAwIDEtLjQgMS0xVjVaIiAvPgogIDxwYXRoIGQ9Ik0xNCA4aDQiIC8+CiAgPHBhdGggZD0iTTE0IDE4aDQiIC8+CiAgPHBhdGggZD0ibTIwIDMtMiAydjE1YzAgLjYuNCAxIDEgMWgyYy42IDAgMS0uNCAxLTFWNVoiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/fence
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Fence = createLucideIcon('fence', [["path",{"d":"M4 3 2 5v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z"}],["path",{"d":"M6 8h4"}],["path",{"d":"M6 18h4"}],["path",{"d":"m12 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z"}],["path",{"d":"M14 8h4"}],["path",{"d":"M14 18h4"}],["path",{"d":"m20 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z"}]]) as AstroComponent;

export default Fence;
