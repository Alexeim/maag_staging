
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name HardDriveUpload
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTYgNi00LTQtNCA0IiAvPgogIDxwYXRoIGQ9Ik0xMiAydjgiIC8+CiAgPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjgiIHg9IjIiIHk9IjE0IiByeD0iMiIgLz4KICA8cGF0aCBkPSJNNiAxOGguMDEiIC8+CiAgPHBhdGggZD0iTTEwIDE4aC4wMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/hard-drive-upload
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const HardDriveUpload = createLucideIcon('hard-drive-upload', [["path",{"d":"m16 6-4-4-4 4"}],["path",{"d":"M12 2v8"}],["rect",{"width":"20","height":"8","x":"2","y":"14","rx":"2"}],["path",{"d":"M6 18h.01"}],["path",{"d":"M10 18h.01"}]]) as AstroComponent;

export default HardDriveUpload;
