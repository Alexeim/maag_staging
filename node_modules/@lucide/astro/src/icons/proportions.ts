
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Proportions
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMTYiIHg9IjIiIHk9IjQiIHJ4PSIyIiAvPgogIDxwYXRoIGQ9Ik0xMiA5djExIiAvPgogIDxwYXRoIGQ9Ik0yIDloMTNhMiAyIDAgMCAxIDIgMnY5IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/proportions
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Proportions = createLucideIcon('proportions', [["rect",{"width":"20","height":"16","x":"2","y":"4","rx":"2"}],["path",{"d":"M12 9v11"}],["path",{"d":"M2 9h13a2 2 0 0 1 2 2v9"}]]) as AstroComponent;

export default Proportions;
