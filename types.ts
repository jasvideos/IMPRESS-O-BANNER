
export interface PrintSize {
  name: string;
  widthMm: number;
  heightMm: number;
  id: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  name: string;
  dataUrl: string;
}

export enum QualityStatus {
  EXCELLENT = 'Excelente',
  GOOD = 'Boa',
  FAIR = 'Regular',
  POOR = 'Ruim - Baixa Resolução',
}
