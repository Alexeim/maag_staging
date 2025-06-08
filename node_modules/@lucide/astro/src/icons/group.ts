
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Group
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyA3VjVjMC0xLjEuOS0yIDItMmgyIiAvPgogIDxwYXRoIGQ9Ik0xNyAzaDJjMS4xIDAgMiAuOSAyIDJ2MiIgLz4KICA8cGF0aCBkPSJNMjEgMTd2MmMwIDEuMS0uOSAyLTIgMmgtMiIgLz4KICA8cGF0aCBkPSJNNyAyMUg1Yy0xLjEgMC0yLS45LTItMnYtMiIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4PSI3IiB5PSI3IiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4PSIxMCIgeT0iMTIiIHJ4PSIxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/group
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Group = createLucideIcon('group', [["path",{"d":"M3 7V5c0-1.1.9-2 2-2h2"}],["path",{"d":"M17 3h2c1.1 0 2 .9 2 2v2"}],["path",{"d":"M21 17v2c0 1.1-.9 2-2 2h-2"}],["path",{"d":"M7 21H5c-1.1 0-2-.9-2-2v-2"}],["rect",{"width":"7","height":"5","x":"7","y":"7","rx":"1"}],["rect",{"width":"7","height":"5","x":"10","y":"12","rx":"1"}]]) as AstroComponent;

export default Group;
