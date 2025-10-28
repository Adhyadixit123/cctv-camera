import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Plus } from 'lucide-react';
import { Product } from '@/types/checkout';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, variantId: string) => void;
  onProductChange?: (product: Product) => void;
  availableProducts?: Product[];
  size?: 'sm' | 'md' | 'lg';
  cartQuantity?: number; // Number of this product in the cart
  showQuantityInPrice?: boolean;
}

export function ProductCard({ product, onAddToCart, onProductChange, availableProducts = [], size = 'md', cartQuantity = 0, showQuantityInPrice = false }: ProductCardProps) {
  // If there's only one variant, use it directly
  const defaultVariantId = product.variants.length > 0 ? product.variants[0].id : '';
  const [selectedVariant, setSelectedVariant] = useState(defaultVariantId);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Group variants by their options
  const optionNames = new Set<string>();
  
  // Extract all option names from variants
  product.variants.forEach(variant => {
    if (variant.value) {
      const parts = variant.value.split(' / ');
      parts.forEach((part, index) => {
        optionNames.add(`Option ${index + 1}`);
      });
    }
  });
  
  // Helper to get all unique values for a specific option index across all variants
  const getAllValuesForIndex = (optionIndex: number): string[] => {
    const values = new Set<string>();
    product.variants.forEach(variant => {
      if (!variant.value) return;
      const parts = variant.value.split(' / ');
      if (parts[optionIndex]) values.add(parts[optionIndex].trim());
    });
    return Array.from(values);
  };

  // Initial unfiltered values for each option index
  const baseOptionValues: string[][] = Array.from(optionNames).map((_, optionIndex) => getAllValuesForIndex(optionIndex));

  // Debug: log variants and option values computed for this product
  try {
    // eslint-disable-next-line no-console
    console.log('[ProductCard] Product:', product.name, 'variant count:', product.variants.length);
    // eslint-disable-next-line no-console
    console.log('[ProductCard] Variant values (first 10):', product.variants.slice(0, 10).map(v => v.value));
    // eslint-disable-next-line no-console
    console.log('[ProductCard] Option1 values:', baseOptionValues[0]);
  } catch {}

  // Initialize selected options
  const getInitialSelectedOptions = () => {
    const selectedVariantData = product.variants.find(v => v.id === selectedVariant);
    if (selectedVariantData?.value) {
      return selectedVariantData.value.split(' / ');
    }
    return baseOptionValues.map(opt => opt[0] || '');
  };

  const [selectedOptions, setSelectedOptions] = useState<string[]>(getInitialSelectedOptions());

  // Given current selections, compute the valid values for a given option index
  const getOptionValuesForIndex = (optionIndex: number, selections: string[]): string[] => {
    const values = new Set<string>();
    product.variants.forEach(variant => {
      if (!variant.value) return;
      const parts = variant.value.split(' / ');
      // Check if previous selections match this variant
      for (let i = 0; i < optionIndex; i++) {
        if (selections[i] && parts[i]?.trim() !== selections[i]) return; // not compatible
      }
      if (parts[optionIndex]) values.add(parts[optionIndex].trim());
    });
    // If no compatible values found (edge case), fall back to all values for this index
    const list = Array.from(values);
    return list.length > 0 ? list : baseOptionValues[optionIndex] || [];
  };

  // Find matching variant based on selected options
  const findMatchingVariant = (options: string[]): string | undefined => {
    const optionString = options.join(' / ');
    return product.variants.find(v => v.value === optionString)?.id;
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    const newOptions = [...selectedOptions];
    newOptions[optionIndex] = value;

    // For each subsequent option index, recompute the valid values and default to the first
    for (let i = optionIndex + 1; i < newOptions.length; i++) {
      const validValues = getOptionValuesForIndex(i, newOptions);
      newOptions[i] = validValues[0] || '';
    }

    setSelectedOptions(newOptions);

    // Find matching variant
    const variantId = findMatchingVariant(newOptions) || defaultVariantId;
    setSelectedVariant(variantId);
  };

  const selectedVariantData = product.variants.find(v => v.id === selectedVariant);
  const displayPrice = selectedVariantData?.priceAmount ?? product.basePrice;
  const compareAt = selectedVariantData?.compareAtPriceAmount;

  // Size-based styles (image area now uses aspect-square; keep padding/typography responsive)
  const cardPadding = size === 'sm' ? 'p-4' : size === 'md' ? 'p-5' : 'p-6';
  const titleSize = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl';
  const priceSize = size === 'sm' ? 'text-2xl' : size === 'md' ? 'text-3xl' : 'text-3xl';
  const buttonSize = size === 'sm' ? 'md' : 'lg';

  const handleAddToCart = async () => {
    if (selectedVariant && !isAddingToCart) {
      setIsAddingToCart(true);
      try {
        await onAddToCart(product, selectedVariant);
      } catch (error) {
        console.error('Error adding to cart:', error);
      } finally {
        setIsAddingToCart(false);
      }
    }
  };

  const handleProductChange = (productId: string) => {
    if (onProductChange && availableProducts.length > 0) {
      const selectedProduct = availableProducts.find(p => p.id === productId);
      if (selectedProduct) {
        onProductChange(selectedProduct);
      }
    }
  };

  // If no variants are available, show the product as unavailable
  if (product.variants.length === 0) {
    return (
      <Card className="overflow-hidden shadow-lg border-0 bg-card h-full flex flex-col">
        <div className="relative aspect-square w-full">
          <img
            src={product.image}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
            Best Seller
          </Badge>
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-warning text-warning" />
            ))}
            <span className="text-sm text-muted-foreground">(2,847 reviews)</span>
          </div>

          <div>
            <h2 
              className="text-2xl font-bold text-foreground mb-2 truncate hover:whitespace-normal hover:overflow-visible"
              title={product.name}
            >
              {product.name}
            </h2>
            <p className="text-muted-foreground leading-relaxed line-clamp-2">
              {product.description}
            </p>
          </div>

          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-foreground">£{displayPrice}</span>
                {compareAt && compareAt > displayPrice && (
                  <span className="text-sm text-muted-foreground ml-2 line-through">£{compareAt}</span>
                )}
              </div>
            </div>

            <Button
              disabled
              className="w-full bg-muted text-muted-foreground cursor-not-allowed"
            >
              Product Unavailable
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-lg border-0 bg-card h-full flex flex-col">
      <div className="relative aspect-square w-full">
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {size !== 'sm' && (
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
            Best Seller
          </Badge>
        )}
      </div>

      <CardContent className={`${cardPadding} space-y-4 flex-1 flex flex-col`}>
        {size !== 'sm' && (
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-warning text-warning" />
            ))}
            <span className="text-sm text-muted-foreground">(2,847 reviews)</span>
          </div>
        )}

        <div>
          <h2 
            className={`${titleSize} font-bold text-foreground mb-2 truncate hover:whitespace-normal hover:overflow-visible`}
            title={product.name}
          >
            {product.name}
          </h2>
          {product.description && (
            <p className="text-muted-foreground text-sm line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {/* Product Selection Dropdown - optional */}
          {availableProducts.length > 1 && onProductChange && (
            <div>
              <label className="text-sm font-medium text-foreground">Select Product</label>
              <Select value={product.id} onValueChange={handleProductChange}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="select-content max-h-72 overflow-y-auto z-50">
                  {availableProducts.map((availableProduct) => (
                    <SelectItem key={availableProduct.id} value={availableProduct.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{availableProduct.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          £{availableProduct.basePrice}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Advanced option selectors (only show if more than one variant) */}
          {product.variants.length > 1 && baseOptionValues.length > 0 && (
            <div className="space-y-2">
              {baseOptionValues.map((_, idx) => {
                const vals = getOptionValuesForIndex(idx, selectedOptions);
                return (
                <div key={idx}>
                  <label className="text-sm font-medium text-foreground">Option {idx + 1}</label>
                  <Select value={selectedOptions[idx]} onValueChange={(val) => handleOptionChange(idx, val)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="select-content max-h-72 overflow-y-auto z-50">
                      {vals.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className={`${priceSize} font-bold text-foreground`}>£{displayPrice}</span>
              {showQuantityInPrice && cartQuantity > 0 && (
                <span className="text-sm text-blue-600 ml-2">({cartQuantity} in cart)</span>
              )}
              {compareAt && compareAt > displayPrice ? (
                <span className="text-sm text-muted-foreground ml-2 line-through">£{compareAt}</span>
              ) : null}
            </div>
          </div>

          {cartQuantity > 0 ? (
            <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-100">
              <span className="text-sm font-medium text-blue-800">In Cart: {cartQuantity}</span>
              <Button
                onClick={handleAddToCart}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium py-1.5 px-3 text-sm transition-all duration-normal shadow-primary relative"
                size="sm"
                disabled={!selectedVariant || isAddingToCart}
              >
                {isAddingToCart ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Add More
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleAddToCart}
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium py-3 transition-all duration-normal shadow-primary relative"
              size={buttonSize as any}
              disabled={!selectedVariant || isAddingToCart}
            >
              {isAddingToCart ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          )}
        </div>

        {size !== 'sm' && (
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-muted-foreground">Free Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-muted-foreground">30-Day Returns</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}