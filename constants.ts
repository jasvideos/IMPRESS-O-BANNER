
import { PrintSize } from './types';

export const PRINT_SIZES: PrintSize[] = [
  { id: 'a4', name: 'A4 (210 x 297 mm)', widthMm: 210, heightMm: 297 },
  { id: 'a3', name: 'A3 (297 x 420 mm)', widthMm: 297, heightMm: 420 },
  { id: '10x15', name: 'Foto 10x15 cm', widthMm: 100, heightMm: 150 },
  { id: '15x21', name: 'Foto 15x21 cm', widthMm: 150, heightMm: 210 },
  { id: '20x30', name: 'Foto 20x30 cm', widthMm: 200, heightMm: 300 },
  { id: 'custom', name: 'Personalizado', widthMm: 0, heightMm: 0 }
];

export const MM_TO_INCH = 0.0393701;
