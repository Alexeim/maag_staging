
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Gpu
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMiAyMVYzIiAvPgogIDxwYXRoIGQ9Ik0yIDVoMThhMiAyIDAgMCAxIDIgMnY4YTIgMiAwIDAgMS0yIDJIMi4yNiIgLz4KICA8cGF0aCBkPSJNNyAxN3YzYTEgMSAwIDAgMCAxIDFoNWExIDEgMCAwIDAgMS0xdi0zIiAvPgogIDxjaXJjbGUgY3g9IjE2IiBjeT0iMTEiIHI9IjIiIC8+CiAgPGNpcmNsZSBjeD0iOCIgY3k9IjExIiByPSIyIiAvPgo8L3N2Zz4=) - https://lucide.dev/icons/gpu
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Gpu = createLucideIcon('gpu', [["path",{"d":"M2 21V3"}],["path",{"d":"M2 5h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2.26"}],["path",{"d":"M7 17v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3"}],["circle",{"cx":"16","cy":"11","r":"2"}],["circle",{"cx":"8","cy":"11","r":"2"}]]) as AstroComponent;

export default Gpu;
