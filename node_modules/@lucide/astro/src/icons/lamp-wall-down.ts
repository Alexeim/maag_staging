
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name LampWallDown
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTkuOTI5IDE4LjYyOUExIDEgMCAwIDEgMTkgMjBIOWExIDEgMCAwIDEtLjkyOC0xLjM3MWwyLTVBMSAxIDAgMCAxIDExIDEzaDZhMSAxIDAgMCAxIC45MjguNjI5eiIgLz4KICA8cGF0aCBkPSJNNiAzYTIgMiAwIDAgMSAyIDJ2MmEyIDIgMCAwIDEtMiAySDVhMSAxIDAgMCAxLTEtMVY0YTEgMSAwIDAgMSAxLTF6IiAvPgogIDxwYXRoIGQ9Ik04IDZoNGEyIDIgMCAwIDEgMiAydjUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/lamp-wall-down
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const LampWallDown = createLucideIcon('lamp-wall-down', [["path",{"d":"M19.929 18.629A1 1 0 0 1 19 20H9a1 1 0 0 1-.928-1.371l2-5A1 1 0 0 1 11 13h6a1 1 0 0 1 .928.629z"}],["path",{"d":"M6 3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"}],["path",{"d":"M8 6h4a2 2 0 0 1 2 2v5"}]]) as AstroComponent;

export default LampWallDown;
