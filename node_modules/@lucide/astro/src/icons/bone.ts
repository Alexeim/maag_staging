
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Bone
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTcgMTBjLjctLjcgMS42OSAwIDIuNSAwYTIuNSAyLjUgMCAxIDAgMC01IC41LjUgMCAwIDEtLjUtLjUgMi41IDIuNSAwIDEgMC01IDBjMCAuODEuNyAxLjggMCAyLjVsLTcgN2MtLjcuNy0xLjY5IDAtMi41IDBhMi41IDIuNSAwIDAgMCAwIDVjLjI4IDAgLjUuMjIuNS41YTIuNSAyLjUgMCAxIDAgNSAwYzAtLjgxLS43LTEuOCAwLTIuNVoiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/bone
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Bone = createLucideIcon('bone', [["path",{"d":"M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"}]]) as AstroComponent;

export default Bone;
