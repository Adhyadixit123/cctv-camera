export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  // Absolute price for this variant (Shopify variant price)
  priceAmount: number;
  // Optional compare-at price for this variant
  compareAtPriceAmount?: number;
  // Backwards-compat for older code paths using modifiers
  priceModifier?: number;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  popular?: boolean;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  addOns: string[];
}

export interface CheckoutStep {
  id: number;
  title: string;
  description: string;
  addOns: AddOn[];
  collectionId?: string;
  cameraType?: string;
  cameraLevel?: string;
}

export interface OrderSummary {
  subtotal: number;
  tax: number;
  total: number;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
}

// Camera-specific types
export type CameraType = 'residential' | 'rural' | 'industrial';
export type CameraLevel = 'entry' | 'mid' | 'high';

export interface CameraSelection {
  type: CameraType;
  level: CameraLevel;
  selectedProduct?: Product;
  extras: AddOn[];
}