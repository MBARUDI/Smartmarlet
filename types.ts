
export interface Product {
  id: string;
  name: string;
  category: string;
  image?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface CartItem extends Product {
  quantity: number;
  estimatedUnitPrice: number | null; // Null while loading
  isLoadingPrice: boolean;
  sources?: GroundingSource[];
  error?: string;
}

export interface CartSummary {
  totalItems: number;
  totalEstimatedPrice: number;
  isCalculating: boolean;
}
