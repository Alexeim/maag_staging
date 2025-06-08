
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name LayoutTemplate
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iNyIgeD0iMyIgeT0iMyIgcng9IjEiIC8+CiAgPHJlY3Qgd2lkdGg9IjkiIGhlaWdodD0iNyIgeD0iMyIgeT0iMTQiIHJ4PSIxIiAvPgogIDxyZWN0IHdpZHRoPSI1IiBoZWlnaHQ9IjciIHg9IjE2IiB5PSIxNCIgcng9IjEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/layout-template
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const LayoutTemplate = createLucideIcon('layout-template', [["rect",{"width":"18","height":"7","x":"3","y":"3","rx":"1"}],["rect",{"width":"9","height":"7","x":"3","y":"14","rx":"1"}],["rect",{"width":"5","height":"7","x":"16","y":"14","rx":"1"}]]) as AstroComponent;

export default LayoutTemplate;
