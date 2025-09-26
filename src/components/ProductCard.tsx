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
}

export function ProductCard({ product, onAddToCart, onProductChange, availableProducts = [], size = 'md', cartQuantity = 0 }: ProductCardProps) {
  // If there's only one variant, use it directly
  const defaultVariantId = product.variants.length > 0 ? product.variants[0].id : '';
  const [selectedVariant, setSelectedVariant] = useState(defaultVariantId);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Build advanced option selectors from variant titles (e.g., "Black / Large / 256GB")
  const variantParts = product.variants.map(v => (v.value || v.name || '').split(' / '));
  const optionCount = Math.max(0, ...variantParts.map(p => p.length));
  const optionValues: string[][] = Array.from({ length: optionCount }, (_, i) => {
    const set = new Set<string>();
    variantParts.forEach(parts => {
      if (parts[i]) set.add(parts[i]);
    });
    return Array.from(set);
  });

  // Initialize option selections from the currently selected variant
  const initialSelectedParts = (product.variants.find(v => v.id === selectedVariant)?.value || '').split(' / ');
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    optionValues.map((vals, idx) => initialSelectedParts[idx] || vals[0] || '')
  );

  // Whenever option selection changes, pick the matching variant id
  const resolveVariantFromOptions = (opts: string[]) => {
    const match = product.variants.find(v => {
      const parts = (v.value || v.name || '').split(' / ');
      return opts.every((opt, idx) => (parts[idx] || '') === opt);
    });
    return match?.id || defaultVariantId;
  };

  const handleOptionChange = (level: number, value: string) => {
    const next = [...selectedOptions];
    next[level] = value;
    // If changing a higher-level option invalidates deeper levels, reset them to first available
    for (let i = level + 1; i < next.length; i++) {
      const availableForLevel = optionValues[i];
      next[i] = availableForLevel[0] || '';
    }
    setSelectedOptions(next);
    const id = resolveVariantFromOptions(next);
    setSelectedVariant(id);
  };

  const selectedVariantData = product.variants.find(v => v.id === selectedVariant);
  const displayPrice = selectedVariantData?.priceAmount ?? product.basePrice;
  const compareAt = selectedVariantData?.compareAtPriceAmount;

  // Size-based styles
  const imageHeight = size === 'sm' ? 'h-40' : size === 'md' ? 'h-64' : 'h-80';
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
      <Card className="overflow-hidden shadow-lg border-0 bg-card">
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-80 object-cover"
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-foreground">${displayPrice}</span>
                {compareAt && compareAt > displayPrice && (
                  <span className="text-sm text-muted-foreground ml-2 line-through">${compareAt}</span>
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
    <Card className="overflow-hidden shadow-lg border-0 bg-card">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full ${imageHeight} object-cover`}
        />
        {size !== 'sm' && (
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
            Best Seller
          </Badge>
        )}
      </div>

      <CardContent className={`${cardPadding} space-y-4`}>
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
                <SelectContent>
                  {availableProducts.map((availableProduct) => (
                    <SelectItem key={availableProduct.id} value={availableProduct.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{availableProduct.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ${availableProduct.basePrice}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Advanced option selectors (only show if more than one variant) */}
          {product.variants.length > 1 && optionCount > 0 && (
            <div className="space-y-2">
              {optionValues.map((vals, idx) => (
                <div key={idx}>
                  <label className="text-sm font-medium text-foreground">Option {idx + 1}</label>
                  <Select value={selectedOptions[idx]} onValueChange={(val) => handleOptionChange(idx, val)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vals.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className={`${priceSize} font-bold text-foreground`}>${displayPrice}</span>
              {compareAt && compareAt > displayPrice ? (
                <span className="text-sm text-muted-foreground ml-2 line-through">${compareAt}</span>
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