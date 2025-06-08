
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Plug2
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOSAydjYiIC8+CiAgPHBhdGggZD0iTTE1IDJ2NiIgLz4KICA8cGF0aCBkPSJNMTIgMTd2NSIgLz4KICA8cGF0aCBkPSJNNSA4aDE0IiAvPgogIDxwYXRoIGQ9Ik02IDExVjhoMTJ2M2E2IDYgMCAxIDEtMTIgMFoiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/plug-2
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Plug2 = createLucideIcon('plug-2', [["path",{"d":"M9 2v6"}],["path",{"d":"M15 2v6"}],["path",{"d":"M12 17v5"}],["path",{"d":"M5 8h14"}],["path",{"d":"M6 11V8h12v3a6 6 0 1 1-12 0Z"}]]) as AstroComponent;

export default Plug2;
