
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name TestTubeDiagonal
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEgNyA2LjgyIDIxLjE4YTIuODMgMi44MyAwIDAgMS0zLjk5LS4wMWEyLjgzIDIuODMgMCAwIDEgMC00TDE3IDMiIC8+CiAgPHBhdGggZD0ibTE2IDIgNiA2IiAvPgogIDxwYXRoIGQ9Ik0xMiAxNkg0IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/test-tube-diagonal
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const TestTubeDiagonal = createLucideIcon('test-tube-diagonal', [["path",{"d":"M21 7 6.82 21.18a2.83 2.83 0 0 1-3.99-.01a2.83 2.83 0 0 1 0-4L17 3"}],["path",{"d":"m16 2 6 6"}],["path",{"d":"M12 16H4"}]]) as AstroComponent;

export default TestTubeDiagonal;
