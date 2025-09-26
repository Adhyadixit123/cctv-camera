import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Plus, ArrowLeft, ArrowRight, Star, ExternalLink, ShoppingBag, Minus, Trash2, Camera, Settings, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckoutStep, AddOn, CameraType, CameraLevel } from '@/types/checkout';
import { useCart } from '@/hooks/useCart';
import { ShopifyProductService } from '@/services/shopifyService';
import { ProductCard } from '@/components/ProductCard';

// Define OrderItem type for type safety
interface OrderItem {
  lineId: string;
  name: string;
  price: number;
  quantity: number;
}

// Define OrderSummary type
interface OrderSummary {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
}

interface CheckoutFlowProps {
  steps: CheckoutStep[];
  onComplete: () => void;
  onBack: () => void;
}

export function CheckoutFlow({ steps, onComplete, onBack }: CheckoutFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProducts, setStepProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedCameraType, setSelectedCameraType] = useState<CameraType | null>(null);
  const [selectedCameraLevel, setSelectedCameraLevel] = useState<CameraLevel | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(4);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const [currentStepData, setCurrentStepData] = useState<CheckoutStep | null>(null);

  const { shopifyCart, addAddOn, removeAddOn, getOrderSummary, getCheckoutUrl, isLoading, updateProductSelection, loadCart, updateCartItem, removeFromCart, addVariantToCart } = useCart();

  // Update current step data when step changes
  useEffect(() => {
    if (steps && steps.length > 0 && currentStep < steps.length) {
      setCurrentStepData(steps[currentStep]);
    }
  }, [currentStep, steps]);

  // Load order summary when cart changes
  useEffect(() => {
    const loadOrderSummary = async () => {
      if (shopifyCart?.id) {
        const summary = await getOrderSummary();
        setOrderSummary(summary);
        
        // Get checkout URL if not already available
        if (!checkoutUrl) {
          const url = await getCheckoutUrl();
          setCheckoutUrl(url);
        }
      }
    };

    loadOrderSummary();
  }, [shopifyCart, getOrderSummary, getCheckoutUrl, checkoutUrl]);

  // Helper: add first available variant from a Shopify collection handle
  const addFromCollectionHandle = async (handle: string, quantity: number = 1) => {
    console.log('[CheckoutFlow] Adding from collection handle:', handle, 'qty:', quantity);
    const variantId = await ShopifyProductService.getFirstVariantIdFromCollectionHandle(handle);
    console.log('[CheckoutFlow] Resolved variantId:', variantId);
    if (!variantId) {
      console.error('No variant found for collection handle:', handle);
      alert(`No available product found in ${handle.replace('-', ' ')} collection.`);
      return false;
    }
    const ok = await addVariantToCart(variantId, quantity);
    if (!ok) {
      alert('Failed to add item to cart.');
    }
    return ok;
  };

  // Refresh cart data when component mounts to sync with Index component
  useEffect(() => {
    const refreshCartData = async () => {
      // Small delay to ensure any pending cart operations are complete
      await new Promise(resolve => setTimeout(resolve, 100));
      if (shopifyCart?.id) {
        console.log('Refreshing cart data in CheckoutFlow...');
        await loadCart(shopifyCart.id);
      }
    };

    refreshCartData();
  }, [loadCart, shopifyCart?.id]);

  // Dummy camera products for when collections aren't available
  const dummyProducts = [
    // Residential Entry Level
    {
      id: 'residential-entry-1',
      name: 'HomeGuard Basic',
      description: 'Affordable residential security camera with basic features',
      basePrice: 89,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      variants: [
        { id: 'var1', name: 'White', value: 'white', priceModifier: 0 },
        { id: 'var2', name: 'Black', value: 'black', priceModifier: 5 }
      ]
    },
    {
      id: 'residential-entry-2',
      name: 'SecureHome Standard',
      description: 'Standard residential camera with motion detection',
      basePrice: 129,
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
      variants: [
        { id: 'var1', name: 'White', value: 'white', priceModifier: 0 },
        { id: 'var2', name: 'Black', value: 'black', priceModifier: 5 }
      ]
    },
    // Residential Mid Range
    {
      id: 'residential-mid-1',
      name: 'SmartGuard Pro',
      description: '4K residential camera with smart detection',
      basePrice: 249,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      variants: [
        { id: 'var1', name: 'White', value: 'white', priceModifier: 0 },
        { id: 'var2', name: 'Black', value: 'black', priceModifier: 10 }
      ]
    },
    {
      id: 'residential-mid-2',
      name: 'VisionGuard Elite',
      description: 'Advanced residential camera with weather resistance',
      basePrice: 299,
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
      variants: [
        { id: 'var1', name: 'White', value: 'white', priceModifier: 0 },
        { id: 'var2', name: 'Black', value: 'black', priceModifier: 10 }
      ]
    },
    // Residential High Range
    {
      id: 'residential-high-1',
      name: 'UltraGuard Premium',
      description: '8K premium residential camera with AI analytics',
      basePrice: 599,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      variants: [
        { id: 'var1', name: 'White', value: 'white', priceModifier: 0 },
        { id: 'var2', name: 'Black', value: 'black', priceModifier: 20 }
      ]
    },
    {
      id: 'residential-high-2',
      name: 'Sentinel Pro Max',
      description: 'Top-tier residential camera with 360° coverage',
      basePrice: 799,
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
      variants: [
        { id: 'var1', name: 'White', value: 'white', priceModifier: 0 },
        { id: 'var2', name: 'Black', value: 'black', priceModifier: 20 }
      ]
    },
    // Rural Entry Level
    {
      id: 'rural-entry-1',
      name: 'FarmGuard Basic',
      description: 'Durable rural camera for farm monitoring',
      basePrice: 149,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      variants: [
        { id: 'var1', name: 'Green', value: 'green', priceModifier: 0 },
        { id: 'var2', name: 'Brown', value: 'brown', priceModifier: 5 }
      ]
    },
    {
      id: 'rural-entry-2',
      name: 'CountryWatch Standard',
      description: 'Weather-resistant rural surveillance camera',
      basePrice: 199,
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
      variants: [
        { id: 'var1', name: 'Green', value: 'green', priceModifier: 0 },
        { id: 'var2', name: 'Brown', value: 'brown', priceModifier: 5 }
      ]
    },
    // Rural Mid Range
    {
      id: 'rural-mid-1',
      name: 'AgriGuard Pro',
      description: '4K rural camera with smart farm detection',
      basePrice: 349,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      variants: [
        { id: 'var1', name: 'Green', value: 'green', priceModifier: 0 },
        { id: 'var2', name: 'Brown', value: 'brown', priceModifier: 15 }
      ]
    },
    {
      id: 'rural-mid-2',
      name: 'FieldWatch Elite',
      description: 'Advanced rural camera with extreme weather protection',
      basePrice: 449,
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
      variants: [
        { id: 'var1', name: 'Green', value: 'green', priceModifier: 0 },
        { id: 'var2', name: 'Brown', value: 'brown', priceModifier: 15 }
      ]
    },
    // Rural High Range
    {
      id: 'rural-high-1',
      name: 'AgriSentinel Premium',
      description: '8K premium rural camera with AI farm analytics',
      basePrice: 899,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      variants: [
        { id: 'var1', name: 'Green', value: 'green', priceModifier: 0 },
        { id: 'var2', name: 'Brown', value: 'brown', priceModifier: 30 }
      ]
    },
    {
      id: 'rural-high-2',
      name: 'FarmGuard Ultra',
      description: 'Top-tier rural camera with 360° farm coverage',
      basePrice: 1199,
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
      variants: [
        { id: 'var1', name: 'Green', value: 'green', priceModifier: 0 },
        { id: 'var2', name: 'Brown', value: 'brown', priceModifier: 30 }
      ]
    },
    // Industrial Entry Level
    {
      id: 'industrial-entry-1',
      name: 'IndustriGuard Basic',
      description: 'Heavy-duty industrial camera for basic monitoring',
      basePrice: 299,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      variants: [
        { id: 'var1', name: 'Gray', value: 'gray', priceModifier: 0 },
        { id: 'var2', name: 'Yellow', value: 'yellow', priceModifier: 10 }
      ]
    },
    {
      id: 'industrial-entry-2',
      name: 'SiteWatch Standard',
      description: 'Industrial-grade camera with impact resistance',
      basePrice: 399,
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
      variants: [
        { id: 'var1', name: 'Gray', value: 'gray', priceModifier: 0 },
        { id: 'var2', name: 'Yellow', value: 'yellow', priceModifier: 10 }
      ]
    },
    // Industrial Mid Range
    {
      id: 'industrial-mid-1',
      name: 'FactoryGuard Pro',
      description: '4K industrial camera with smart detection',
      basePrice: 699,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      variants: [
        { id: 'var1', name: 'Gray', value: 'gray', priceModifier: 0 },
        { id: 'var2', name: 'Yellow', value: 'yellow', priceModifier: 25 }
      ]
    },
    {
      id: 'industrial-mid-2',
      name: 'PlantWatch Elite',
      description: 'Advanced industrial camera with extreme durability',
      basePrice: 899,
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
      variants: [
        { id: 'var1', name: 'Gray', value: 'gray', priceModifier: 0 },
        { id: 'var2', name: 'Yellow', value: 'yellow', priceModifier: 25 }
      ]
    },
    // Industrial High Range
    {
      id: 'industrial-high-1',
      name: 'IndustriSentinel Premium',
      description: '8K premium industrial camera with AI analytics',
      basePrice: 1799,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      variants: [
        { id: 'var1', name: 'Gray', value: 'gray', priceModifier: 0 },
        { id: 'var2', name: 'Yellow', value: 'yellow', priceModifier: 50 }
      ]
    },
    {
      id: 'industrial-high-2',
      name: 'MegaGuard Ultra',
      description: 'Top-tier industrial camera with 360° coverage',
      basePrice: 2399,
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400',
      variants: [
        { id: 'var1', name: 'Gray', value: 'gray', priceModifier: 0 },
        { id: 'var2', name: 'Yellow', value: 'yellow', priceModifier: 50 }
      ]
    }
  ];

  // Get filtered products based on camera type and level
  const getFilteredProducts = (selectedCameraType: string, selectedCameraLevel: string) => {
    if (!selectedCameraType || !selectedCameraLevel) return [];

    const filterKey = `${selectedCameraType}-${selectedCameraLevel}`;
    return dummyProducts.filter(product =>
      product.id.includes(filterKey.split('-')[0]) &&
      product.id.includes(filterKey.split('-')[1])
    );
  };

  // Pagination logic
  const filteredProducts = getFilteredProducts(selectedCameraType || '', selectedCameraLevel || '');
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset pagination when camera type or level changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCameraType, selectedCameraLevel]);

  // Load products for current step based on current step
  useEffect(() => {
    const loadStepProducts = async () => {
      // For hardcoded camera products, no need to load from Shopify
      if (currentStep >= steps.length - 1) {
        setStepProducts([]);
        setLoadingProducts(false);
        return;
      }

      // If we have hardcoded products for this step, use them
      if (currentStep === 2) { // Products step
        const products = getFilteredProducts(selectedCameraType, selectedCameraLevel);
        setStepProducts(products);
        setLoadingProducts(false);
        return;
      }

      // Add-ons step: last step before order summary
      if (currentStep === steps.length - 2) {
        setLoadingProducts(true);
        try {
          console.log('[CheckoutFlow] Loading add-on products from Shopify');
          // Prefer explicit collection ID provided by the user first
          const addOnCollectionId = 'gid://shopify/Collection/672209174854';
          const possibleAddOnHandles = ['add-extras', 'add-ons', 'addons', 'extras', 'extra', 'accessories', 'add'];
          let addOnProducts: any[] = [];
          // Try by ID first
          try {
            console.log('[CheckoutFlow] Trying add-on collection ID:', addOnCollectionId);
            const byId = await ShopifyProductService.getProductsByCollection(addOnCollectionId);
            if (byId && byId.length > 0) {
              addOnProducts = byId;
              console.log(`[CheckoutFlow] Loaded ${byId.length} add-on products using ID`);
            }
          } catch (err) {
            console.warn('[CheckoutFlow] Add-on ID lookup failed:', err);
          }

          // If ID did not return anything, try common handles
          for (const h of possibleAddOnHandles) {
            try {
              console.log('[CheckoutFlow] Trying add-on collection handle:', h);
              const products = await ShopifyProductService.getProductsByCollection(h);
              if (products && products.length > 0) {
                addOnProducts = products;
                console.log(`[CheckoutFlow] Loaded ${products.length} add-on products using handle: ${h}`);
                break;
              }
            } catch (err) {
              console.warn('[CheckoutFlow] Add-on handle failed:', h, err);
            }
          }
          setStepProducts(addOnProducts);
        } catch (error) {
          console.error('[CheckoutFlow] Error loading add-on products:', error);
          setStepProducts([]);
        } finally {
          setLoadingProducts(false);
        }
        return;
      }

      setLoadingProducts(true);
      try {
        // For other steps, load from Shopify if needed
        if (currentStepData?.collectionId) {
          console.log('Loading products for collection:', currentStepData.collectionId);
          const products = await ShopifyProductService.getProductsByCollection(currentStepData.collectionId);
          setStepProducts(products.slice(0, 4)); // Show up to 4 products per step
          console.log('Loaded products:', products.length);
        } else {
          setStepProducts([]);
        }
      } catch (error) {
        console.error('Error loading step products:', error);
        // Fallback to empty array for hardcoded products
        setStepProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadStepProducts();
  }, [currentStep, currentStepData, steps]);

  // Debug: Log cart state changes
  useEffect(() => {
    console.log('CheckoutFlow - Cart state updated:', {
      hasCart: !!shopifyCart,
      cartId: shopifyCart?.id,
      itemsCount: shopifyCart?.lines?.edges?.length || 0,
      orderSummaryItems: orderSummary?.items?.length || 0
    });
  }, [shopifyCart, orderSummary]);

  const isAddOnSelected = (addOnId: string) => {
    // For now, add-ons are handled locally since Shopify doesn't have add-on concept
    return false;
  };

  // Removed toggle handler for dummy extras; add-ons are loaded automatically into stepProducts
  const handleAddOnToggle = undefined as unknown as (addOnId: string) => Promise<void>;

  const handleQuantityChange = async (lineId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      await removeFromCart(lineId);
    } else {
      // Update item quantity
      await updateCartItem(lineId, newQuantity);
    }
    // Refresh the order summary after quantity change
    if (shopifyCart?.id) {
      const summary = await getOrderSummary();
      setOrderSummary(summary);
    }
  };

  const handleProductAddToCart = async (product: any, variantId: string) => {
    // Create a proper product object for hardcoded cameras
    const productData = {
      id: product.id,
      name: product.name,
      description: product.description,
      basePrice: product.id === '2x-camera' ? 299 : 449,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      variants: [{ id: variantId, name: 'Standard', value: 'standard', priceModifier: 0 }]
    };

    // Use the cart hook's updateProductSelection method to properly manage cart state
    const beforeStep = currentStep;
    await updateProductSelection(productData, variantId);

    // After successfully adding to cart, navigate to next logical step
    // If we are on the products step, go to Add-ons step; otherwise, go to Order Summary
    try {
      // Small delay to ensure cart updates propagate
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch {}

    if (beforeStep < steps.length - 2) {
      setCurrentStep(beforeStep + 1);
    } else {
      setCurrentStep(steps.length - 1);
    }
  };

  const handleRemoveItem = async (lineId: string) => {
    if (shopifyCart?.id) {
      await removeFromCart(lineId);
      const summary = await getOrderSummary();
      setOrderSummary(summary);
    }
  };

  const handleIncreaseQuantity = async (lineId: string, currentQuantity: number) => {
    await handleQuantityChange(lineId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = async (lineId: string, currentQuantity: number) => {
    if (currentQuantity <= 1) {
      await handleRemoveItem(lineId);
    } else {
      await handleQuantityChange(lineId, currentQuantity - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - redirect to Shopify checkout
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCurrentPage(1); // Reset pagination when going back
    } else {
      onBack();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Check if current step is the cart summary step (last step)
  const isCartSummaryStep = currentStep === steps.length - 1;

  // Get step names for progress bar
  const getStepNames = () => {
    return steps.map(step => step.title);
  };

  const cameraTypes: { type: CameraType; title: string; description: string; icon: string }[] = [
    {
      type: 'residential',
      title: 'Residential',
      description: 'Perfect for home security and monitoring',
      icon: '🏠'
    },
    {
      type: 'rural',
      title: 'Rural',
      description: 'Ideal for farm and countryside surveillance',
      icon: '🌾'
    },
    {
      type: 'industrial',
      title: 'Industrial',
      description: 'Heavy-duty cameras for commercial use',
      icon: '🏭'
    }
  ];

  const cameraLevels: { level: CameraLevel; title: string; description: string; features: string[] }[] = [
    {
      level: 'entry',
      title: 'Entry Level',
      description: 'Basic cameras for essential monitoring',
      features: ['1080p HD', 'Basic night vision', 'Motion detection']
    },
    {
      level: 'mid',
      title: 'Mid Range',
      description: 'Enhanced cameras with advanced features',
      features: ['4K Ultra HD', 'Advanced night vision', 'Smart detection', 'Weather resistant']
    },
    {
      level: 'high',
      title: 'High Range',
      description: 'Premium cameras with professional features',
      features: ['8K Ultra HD', 'AI-powered analytics', '360° coverage', 'Extreme weather proof']
    }
  ];

  // Removed local dummy extras. Add-ons are now fetched from Shopify and shown via stepProducts.

  return (
    <div className="min-h-screen bg-blue-50" style={{ minHeight: '135vh' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              {isCartSummaryStep ? 'Review Your Order' : 'Customize Your Camera System'}
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {steps.length - currentStep - 1} more steps to checkout
              </span>
            </div>
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-3" />

          {/* Desktop: Show numbered step names */}
          <div className="hidden md:flex justify-between text-xs text-muted-foreground mt-2">
            {getStepNames().map((stepName, index) => (
              <div key={index} className="flex flex-col items-center">
                <span className={`font-bold text-sm ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                  {index + 1}
                </span>
                <span className={`text-xs mt-1 ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                  {stepName}
                </span>
              </div>
            ))}
          </div>

          {/* Mobile: Show horizontal slider with arrows */}
          <div className="md:hidden mt-2">
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>

              {/* Slider Container */}
              <div className="overflow-x-auto scrollbar-hide mx-10">
                <div className="flex gap-2 pb-2 px-2">
                  {getStepNames().map((stepName, index) => (
                    <div key={index} className="flex-shrink-0 flex flex-col items-center min-w-[80px]">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                        index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`text-xs text-center leading-tight px-1 ${
                        index <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}>
                        {stepName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                disabled={currentStep === steps.length - 1}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className={isCartSummaryStep ? "lg:col-span-2" : "lg:col-span-3"} space-y-6>
            {isCartSummaryStep ? (
              // Final Step - Order Summary
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Order Summary
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Review your camera system selections before proceeding to checkout
                </p>

                {orderSummary && orderSummary.items.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Your Camera System:</h3>
                    {orderSummary.items.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">${item.price.toFixed(2)}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveItem(item.lineId)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDecreaseQuantity(item.lineId, item.quantity)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIncreaseQuantity(item.lineId, item.quantity)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Your cart is empty. Please select a camera system first.
                  </div>
                )}
              </div>
            ) : (
              // Individual Steps (1-4)
              <>
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    {currentStepData.title}
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    {currentStepData.description}
                  </p>
                </div>

                {/* Step-specific content */}
                <div className="bg-card p-6 rounded-lg border">
                  {currentStep === 0 && (
                    // Step 1: Camera Type Selection
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Select Camera Type</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {cameraTypes.map((cameraType) => (
                          <Card
                            key={cameraType.type}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedCameraType === cameraType.type ? 'ring-2 ring-primary bg-primary/5' : ''
                            }`}
                            onClick={() => setSelectedCameraType(cameraType.type)}
                          >
                            <CardContent className="p-6 text-center">
                              <div className="text-4xl mb-4">{cameraType.icon}</div>
                              <h4 className="font-semibold text-lg mb-2">{cameraType.title}</h4>
                              <p className="text-sm text-muted-foreground mb-4">{cameraType.description}</p>
                              <div className="flex justify-center">
                                {selectedCameraType === cameraType.type ? (
                                  <CheckCircle className="w-6 h-6 text-primary" />
                                ) : (
                                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    // Step 2: Camera Level Selection
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Select Camera Range</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {cameraLevels.map((cameraLevel) => (
                          <Card
                            key={cameraLevel.level}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedCameraLevel === cameraLevel.level ? 'ring-2 ring-primary bg-primary/5' : ''
                            }`}
                            onClick={async () => {
                              console.log('[CheckoutFlow] Level selected:', cameraLevel.level);
                              setSelectedCameraLevel(cameraLevel.level);
                              setLoadingProducts(true); // Set loading state

                              // Load products from Shopify collections based on level selection
                              try {
                                // First, get all collections to find the correct handles
                                console.log('[CheckoutFlow] Fetching all collections to find correct handles...');
                                const collections = await ShopifyProductService.getCollections();

                                // Map level to collection based on title similarity
                                const levelCollectionMap = {
                                  entry: collections.find(c =>
                                    c.title.toLowerCase().includes('entry') ||
                                    c.title.toLowerCase().includes('basic') ||
                                    c.title.toLowerCase().includes('level') && c.title.toLowerCase().includes('1')
                                  ),
                                  mid: collections.find(c =>
                                    c.title.toLowerCase().includes('mid') ||
                                    c.title.toLowerCase().includes('standard') ||
                                    c.title.toLowerCase().includes('range') && c.title.toLowerCase().includes('2')
                                  ),
                                  high: collections.find(c =>
                                    c.title.toLowerCase().includes('high') ||
                                    c.title.toLowerCase().includes('premium') ||
                                    c.title.toLowerCase().includes('end') ||
                                    c.title.toLowerCase().includes('range') && c.title.toLowerCase().includes('3')
                                  )
                                };

                                const targetCollection = levelCollectionMap[cameraLevel.level];
                                console.log(`[CheckoutFlow] Looking for ${cameraLevel.level} level collection:`, targetCollection);

                                if (targetCollection) {
                                  console.log(`[CheckoutFlow] Found collection: ${targetCollection.title} (handle: ${targetCollection.handle})`);
                                  const products = await ShopifyProductService.getProductsByCollection(targetCollection.handle);

                                  if (products.length > 0) {
                                    setStepProducts(products);
                                    console.log(`[CheckoutFlow] ✅ Successfully loaded ${products.length} products from ${targetCollection.title}`);
                                  } else {
                                    console.log(`[CheckoutFlow] ⚠️ Collection ${targetCollection.title} has no products, trying fallback handles...`);

                                    // Fallback to hardcoded handles if collection exists but has no products
                                    const fallbackHandles = {
                                      entry: ['entry-level', 'entrylevel', 'entry', 'basic'],
                                      mid: ['mid-range', 'midrange', 'mid', 'standard'],
                                      high: ['high-end', 'highend', 'high', 'premium']
                                    };

                                    for (const handle of fallbackHandles[cameraLevel.level] || []) {
                                      try {
                                        console.log(`[CheckoutFlow] Trying fallback handle: ${handle}`);
                                        const fallbackProducts = await ShopifyProductService.getProductsByCollection(handle);
                                        if (fallbackProducts.length > 0) {
                                          setStepProducts(fallbackProducts);
                                          console.log(`[CheckoutFlow] ✅ Found ${fallbackProducts.length} products using fallback handle: ${handle}`);
                                          break;
                                        }
                                      } catch (e) {
                                        console.log(`[CheckoutFlow] Fallback handle ${handle} failed:`, e.message);
                                      }
                                    }
                                  }
                                } else {
                                  console.error(`[CheckoutFlow] ❌ No collection found for level: ${cameraLevel.level}`);
                                  setStepProducts([]);
                                  alert(`No collection found for ${cameraLevel.level} level. Please check your Shopify collections.`);
                                }
                              } catch (error) {
                                console.error('[CheckoutFlow] Error loading collection products:', error);
                                setStepProducts([]);
                              } finally {
                                setLoadingProducts(false); // Always clear loading state
                              }
                            }}
                          >
                            <CardContent className="p-6 text-center">
                              <h4 className="font-semibold text-lg mb-2">{cameraLevel.title}</h4>
                              <p className="text-sm text-muted-foreground mb-4">{cameraLevel.description}</p>
                              <div className="space-y-2 mb-4">
                                {cameraLevel.features.map((feature, index) => (
                                  <div key={index} className="flex items-center justify-center text-sm">
                                    <span className="text-blue-500 mr-2">✓</span>
                                    {feature}
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-center">
                                {selectedCameraLevel === cameraLevel.level ? (
                                  <CheckCircle className="w-6 h-6 text-primary" />
                                ) : (
                                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    // Step 3: Display products from Shopify collection
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Choose Your Products</h3>
                      {selectedCameraType && selectedCameraLevel ? (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                          <p className="text-blue-800">
                            Selected: <strong>{selectedCameraType}</strong> - <strong>{selectedCameraLevel}</strong> Range
                          </p>
                          <p className="text-sm text-blue-700 mt-2">Browse and select products from the collection below.</p>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                          <p className="text-yellow-800">Please select camera type and range first</p>
                        </div>
                      )}

                      {loadingProducts ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading products from collection...</p>
                        </div>
                      ) : stepProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {stepProducts.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onAddToCart={handleProductAddToCart}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-600">
                          <p>No products found in this collection.</p>
                          <p className="text-sm mt-2">Please check if the collection exists and has products.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep === 3 && (
                    // Step 4: Extras & Accessories (fetched from Shopify)
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Add Extras & Accessories</h3>
                      {loadingProducts ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading add-on products...</p>
                        </div>
                      ) : stepProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {stepProducts.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onAddToCart={handleProductAddToCart}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-600">
                          <p>No add-on products found.</p>
                          <p className="text-sm mt-2">Please ensure your add-on collection has published products.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {currentStep === 0 ? 'Back to Selection' : 'Previous'}
                </Button>

                {/* Back to Menu Button */}
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCurrentStep(0);
                      setCurrentPage(1);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Back to Menu
                  </Button>
                )}
              </div>

              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-8"
                disabled={
                  (currentStep === 0 && !selectedCameraType) ||
                  (currentStep === 1 && !selectedCameraLevel) ||
                  (isCartSummaryStep && (!orderSummary || orderSummary.items.length === 0))
                }
              >
                {isCartSummaryStep ? 'Proceed to Checkout' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Order Summary Sidebar - Only show on final step */}
          {isCartSummaryStep && (
            <div className="lg:col-span-1">
              <Card className="sticky top-4 shadow-lg">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderSummary && (
                    <>
                      {orderSummary.items.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm">${item.price.toFixed(2)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.lineId)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDecreaseQuantity(item.lineId, item.quantity)}
                              disabled={isLoading}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium min-w-[1.5rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleIncreaseQuantity(item.lineId, item.quantity)}
                              disabled={isLoading}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          {index < orderSummary.items.length - 1 && <Separator />}
                        </div>
                      ))}

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>${orderSummary.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax</span>
                          <span>${orderSummary.tax.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>${orderSummary.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {checkoutUrl && currentStep === steps.length - 1 && (
                        <div className="pt-4">
                          <Button
                            onClick={() => window.location.href = checkoutUrl}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Complete Purchase
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AddOnCardProps {
  addOn: AddOn;
  isSelected: boolean;
  onToggle: () => void;
}

function AddOnCard({ addOn, isSelected, onToggle }: AddOnCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-normal hover:shadow-md ${
        isSelected
          ? 'ring-2 ring-primary bg-primary/5'
          : 'hover:border-primary/50'
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{addOn.name}</h3>
              {addOn.popular && (
                <Badge className="bg-blue-600 text-white text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{addOn.description}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-foreground">
                ${addOn.price}
              </span>
              <div className="flex items-center gap-2">
                {isSelected ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <Plus className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
