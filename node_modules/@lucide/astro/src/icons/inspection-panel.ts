
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name InspectionPanel
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiAvPgogIDxwYXRoIGQ9Ik03IDdoLjAxIiAvPgogIDxwYXRoIGQ9Ik0xNyA3aC4wMSIgLz4KICA8cGF0aCBkPSJNNyAxN2guMDEiIC8+CiAgPHBhdGggZD0iTTE3IDE3aC4wMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/inspection-panel
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const InspectionPanel = createLucideIcon('inspection-panel', [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M7 7h.01"}],["path",{"d":"M17 7h.01"}],["path",{"d":"M7 17h.01"}],["path",{"d":"M17 17h.01"}]]) as AstroComponent;

export default InspectionPanel;
