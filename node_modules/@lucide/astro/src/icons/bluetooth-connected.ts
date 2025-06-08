
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name BluetoothConnected
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtNyA3IDEwIDEwLTUgNVYybDUgNUw3IDE3IiAvPgogIDxsaW5lIHgxPSIxOCIgeDI9IjIxIiB5MT0iMTIiIHkyPSIxMiIgLz4KICA8bGluZSB4MT0iMyIgeDI9IjYiIHkxPSIxMiIgeTI9IjEyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/bluetooth-connected
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const BluetoothConnected = createLucideIcon('bluetooth-connected', [["path",{"d":"m7 7 10 10-5 5V2l5 5L7 17"}],["line",{"x1":"18","x2":"21","y1":"12","y2":"12"}],["line",{"x1":"3","x2":"6","y1":"12","y2":"12"}]]) as AstroComponent;

export default BluetoothConnected;
