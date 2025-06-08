
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Columns4
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiAvPgogIDxwYXRoIGQ9Ik03LjUgM3YxOCIgLz4KICA8cGF0aCBkPSJNMTIgM3YxOCIgLz4KICA8cGF0aCBkPSJNMTYuNSAzdjE4IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/columns-4
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Columns4 = createLucideIcon('columns-4', [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M7.5 3v18"}],["path",{"d":"M12 3v18"}],["path",{"d":"M16.5 3v18"}]]) as AstroComponent;

export default Columns4;
