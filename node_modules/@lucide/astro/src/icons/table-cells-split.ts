
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name TableCellsSplit
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTVWOSIgLz4KICA8cGF0aCBkPSJNMyAxNWgxOCIgLz4KICA8cGF0aCBkPSJNMyA5aDE4IiAvPgogIDxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgeD0iMyIgeT0iMyIgcng9IjIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/table-cells-split
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const TableCellsSplit = createLucideIcon('table-cells-split', [["path",{"d":"M12 15V9"}],["path",{"d":"M3 15h18"}],["path",{"d":"M3 9h18"}],["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}]]) as AstroComponent;

export default TableCellsSplit;
