export interface Product {
  id: string;
  name: string;
  defaultPrice: number;
  requiresLiters: boolean;
  minLiters?: number;
  maxLiters?: number;
}
