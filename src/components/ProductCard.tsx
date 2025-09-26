import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '@/types/checkout';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, variantId: string) => void;
  onProductChange?: (product: Product) => void;
  availableProducts?: Product[];
}

export function ProductCard({ product, onAddToCart, onProductChange, availableProducts = [] }: ProductCardProps) {
  // Only use variant selection if there are multiple variants
  const hasMultipleVariants = product.variants.length > 1;

  // If there's only one variant, use it directly
  const defaultVariantId = product.variants.length > 0 ? product.variants[0].id : '';
  const [selectedVariant, setSelectedVariant] = useState(defaultVariantId);

  const selectedVariantData = product.variants.find(v => v.id === selectedVariant);
  const finalPrice = product.basePrice + (selectedVariantData?.priceModifier || 0);

  const handleAddToCart = () => {
    if (selectedVariant) {
      onAddToCart(product, selectedVariant);
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

  // Don't render if no variants are available
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
            <h2 className="text-2xl font-bold text-foreground mb-2">{product.name}</h2>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-bold text-foreground">${finalPrice}</span>
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
          <h2 className="text-2xl font-bold text-foreground mb-2">{product.name}</h2>
          {/* Product description hidden as requested */}
        </div>

        <div className="space-y-3">
          {/* Product Selection Dropdown - Only show if multiple products are available */}
          {availableProducts.length > 1 && onProductChange && (
            <div>
              <label className="text-sm font-medium text-foreground">Select Tree Type</label>
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

          {/* Only show variant selector if there are multiple variants */}
          {hasMultipleVariants && (
            <div>
              <label className="text-sm font-medium text-foreground">Select Size</label>
              <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {product.variants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{variant.value}</span>
                        {variant.priceModifier > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            +${variant.priceModifier}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold text-foreground">${finalPrice}</span>
              {selectedVariantData?.priceModifier && hasMultipleVariants ? (
                <span className="text-sm text-muted-foreground ml-2 line-through">
                  ${product.basePrice}
                </span>
              ) : null}
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium py-3 transition-all duration-normal shadow-primary"
            size="lg"
            disabled={!selectedVariant}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart
          </Button>
        </div>

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
      </CardContent>
    </Card>
  );
}