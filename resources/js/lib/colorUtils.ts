/**
 * Color utility functions for handling various color formats
 * and ensuring compatibility with HTML color inputs
 */

/**
 * Converts any color format to a valid hexadecimal color
 * that can be used with HTML <input type="color"> elements
 * 
 * @param color - Color in any format (hex, rgb, rgba, named, transparent)
 * @returns Valid hex color string (e.g., "#ff0000")
 */
export const convertToValidHex = (color: string): string => {
  // Handle transparent
  if (color === 'transparent') return '#000000';
  
  // Handle rgba() format
  if (color.startsWith('rgba(')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }
  
  // Handle rgb() format
  if (color.startsWith('rgb(')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }
  
  // Handle named colors
  const namedColors: { [key: string]: string } = {
    'black': '#000000',
    'white': '#ffffff',
    'red': '#ff0000',
    'green': '#008000',
    'blue': '#0000ff',
    'yellow': '#ffff00',
    'cyan': '#00ffff',
    'magenta': '#ff00ff',
    'silver': '#c0c0c0',
    'gray': '#808080',
    'maroon': '#800000',
    'olive': '#808000',
    'lime': '#00ff00',
    'aqua': '#00ffff',
    'teal': '#008080',
    'navy': '#000080',
    'fuchsia': '#ff00ff',
    'purple': '#800080'
  };
  
  if (namedColors[color.toLowerCase()]) {
    return namedColors[color.toLowerCase()];
  }
  
  // Return as-is if already valid hex, otherwise default to black
  return color.startsWith('#') && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#000000';
};

/**
 * Checks if a color value is valid for HTML color inputs
 * 
 * @param color - Color string to validate
 * @returns True if the color is a valid hex format
 */
export const isValidHexColor = (color: string): boolean => {
  return color.startsWith('#') && /^#[0-9A-Fa-f]{6}$/.test(color);
};

/**
 * Converts a hex color to rgba format
 * 
 * @param hex - Hex color string (e.g., "#ff0000")
 * @param alpha - Alpha value (0-1)
 * @returns RGBA color string
 */
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}; 