
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name TextCursor
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTcgMjJoLTFhNCA0IDAgMCAxLTQtNFY2YTQgNCAwIDAgMSA0LTRoMSIgLz4KICA8cGF0aCBkPSJNNyAyMmgxYTQgNCAwIDAgMCA0LTR2LTEiIC8+CiAgPHBhdGggZD0iTTcgMmgxYTQgNCAwIDAgMSA0IDR2MSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/text-cursor
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const TextCursor = createLucideIcon('text-cursor', [["path",{"d":"M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1"}],["path",{"d":"M7 22h1a4 4 0 0 0 4-4v-1"}],["path",{"d":"M7 2h1a4 4 0 0 1 4 4v1"}]]) as AstroComponent;

export default TextCursor;
