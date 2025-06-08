
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Shuffle
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTggMTQgNCA0LTQgNCIgLz4KICA8cGF0aCBkPSJtMTggMiA0IDQtNCA0IiAvPgogIDxwYXRoIGQ9Ik0yIDE4aDEuOTczYTQgNCAwIDAgMCAzLjMtMS43bDUuNDU0LTguNmE0IDQgMCAwIDEgMy4zLTEuN0gyMiIgLz4KICA8cGF0aCBkPSJNMiA2aDEuOTcyYTQgNCAwIDAgMSAzLjYgMi4yIiAvPgogIDxwYXRoIGQ9Ik0yMiAxOGgtNi4wNDFhNCA0IDAgMCAxLTMuMy0xLjhsLS4zNTktLjQ1IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/shuffle
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Shuffle = createLucideIcon('shuffle', [["path",{"d":"m18 14 4 4-4 4"}],["path",{"d":"m18 2 4 4-4 4"}],["path",{"d":"M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"}],["path",{"d":"M2 6h1.972a4 4 0 0 1 3.6 2.2"}],["path",{"d":"M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"}]]) as AstroComponent;

export default Shuffle;
