
export interface Product {
  id: string;
  name: string;
  category: string;
  image?: string;
  suggestedPrice?: number;
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
  suggestedPrice?: number;
  isCollected?: boolean;
}

export interface CartSummary {
  totalItems: number;
  totalEstimatedPrice: number;
  isCalculating: boolean;
}
