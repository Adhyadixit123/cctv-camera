import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProductCard } from '@/components/ProductCard';
import { CheckoutFlow } from '@/components/CheckoutFlow';
import { OrderComplete } from '@/components/OrderComplete';
import { CartButton } from '@/components/CartButton';
import { ShopifyProductService } from '@/services/shopifyService';
import { useCart } from '@/hooks/useCart';
import { Product, CheckoutStep, CameraType, CameraLevel } from '@/types/checkout';
import { Menu, X, ShoppingBag, User, Search, Heart, Minus, Plus, Trash2 } from 'lucide-react';

type AppState = 'camera-type' | 'camera-level' | 'products' | 'addons' | 'order-summary' | 'checkout' | 'complete';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('camera-type');
  const { updateProductSelection, setAllAddOns, isLoading, error } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [checkoutSteps, setCheckoutSteps] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCameraType, setSelectedCameraType] = useState<CameraType | null>(null);
  const [selectedCameraLevel, setSelectedCameraLevel] = useState<CameraLevel | null>(null);

  useEffect(() => {
    // Create the camera checkout flow steps
    const createCheckoutSteps = async () => {
      try {
        // Define the camera checkout steps
        const steps = [
          {
            id: 1,
            title: 'Camera Type',
            description: 'Select your camera type',
            addOns: [],
            cameraType: null
          },
          {
            id: 2,
            title: 'Camera Level',
            description: 'Choose your camera range',
            addOns: [],
            cameraLevel: null
          },
          {
            id: 3,
            title: 'Camera Selection',
            description: 'Choose your camera from the collection',
            addOns: [],
            collectionId: null // Will be set based on camera type and level
          },
          {
            id: 4,
            title: 'Extras & Accessories',
            description: 'Add additional accessories and services',
            addOns: [],
            collectionId: null // Will be set to extras collection
          },
          {
            id: 5,
            title: 'Order Summary',
            description: 'Review your selections before checkout',
            addOns: [],
            collectionId: null
          }
        ];

        setCheckoutSteps(steps);
      } catch (error) {
        console.error('Error creating checkout steps:', error);
        setCheckoutSteps([]);
      }
    };

    createCheckoutSteps();
  }, []);

  const handleCameraTypeSelect = (cameraType: CameraType) => {
    setSelectedCameraType(cameraType);
    setAppState('camera-level');
  };

  const handleCameraLevelSelect = (cameraLevel: CameraLevel) => {
    setSelectedCameraLevel(cameraLevel);
    setAppState('products');
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    // This function can be used to update quantities if needed
    console.log(`Quantity changed for ${productId}: ${newQuantity}`);
  };

  const handleAddToCart = async (product: Product, variantId: string) => {
    await updateProductSelection(product, variantId);
    setAppState('addons');
  };

  const handleCartClick = () => {
    setAppState('checkout');
  };

  const handleStoreClick = () => {
    const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
    if (storeDomain) {
      window.open(`https://${storeDomain}`, '_blank');
    }
  };

  const handleCheckoutComplete = () => {
    setAppState('complete');
  };

  const handleBackToCameraType = () => {
    setAppState('camera-type');
    setSelectedCameraType(null);
    setSelectedCameraLevel(null);
  };

  const handleNewOrder = () => {
    setAppState('camera-type');
    setSelectedCameraType(null);
    setSelectedCameraLevel(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const cameraTypes: { type: CameraType; title: string }[] = [
    { type: 'residential', title: 'Residential' },
    { type: 'rural', title: 'Rural' },
    { type: 'industrial', title: 'Industrial' }
  ];

  const cameraLevels: { level: CameraLevel; title: string }[] = [
    { level: 'entry', title: 'Basic' },
    { level: 'mid', title: 'Standard' },
    { level: 'high', title: 'Premium' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hide Shopify's default header */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .shopify-section-header { display: none !important; }
          header[class*="shop"] { display: none !important; }
          .header-wrapper { display: none !important; }
          [data-section-type="header"] { display: none !important; }
          .shopify-header { display: none !important; }
          .site-header { display: none !important; }
          #shopify-header { display: none !important; }
          #header { display: none !important; }
          .announcement-bar { display: none !important; }
          [role="banner"] { display: none !important; }
        `
      }} />

      {/* Main Content - Only Add-ons Section */}
      <main className="bg-white">
        {appState === 'camera-type' && (
          <div className="max-w-md mx-auto p-4">
            <h2 className="text-xl font-medium text-gray-900 mb-6 text-center">
              Select Camera Type
            </h2>
            <div className="space-y-3">
              {cameraTypes.map((cameraType) => (
                <button
                  key={cameraType.type}
                  onClick={() => handleCameraTypeSelect(cameraType.type)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center"
                >
                  {cameraType.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {appState === 'camera-level' && selectedCameraType && (
          <div className="max-w-md mx-auto p-4">
            <div className="mb-4">
              <button
                onClick={() => {
                  setAppState('camera-type');
                  setSelectedCameraType(null);
                }}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center mb-2"
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>

            <h2 className="text-xl font-medium text-gray-900 mb-6 text-center">
              Select Camera Level
            </h2>
            
            <div className="space-y-3">
              {cameraLevels.map((cameraLevel) => (
                <button
                  key={cameraLevel.level}
                  onClick={() => handleCameraLevelSelect(cameraLevel.level)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center"
                >
                  {cameraLevel.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {appState === 'products' && selectedCameraType && selectedCameraLevel && (
          <div className="max-w-md mx-auto p-4">
            <div className="mb-4">
              <button
                onClick={() => {
                  setAppState('camera-level');
                  setSelectedCameraLevel(null);
                }}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center mb-2"
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>

            <h2 className="text-xl font-medium text-gray-900 mb-6 text-center">
              Select Package
            </h2>
            
            <div className="space-y-3 mb-8">
              <button
                onClick={() => {
                  handleAddToCart({
                    id: '2x-camera',
                    name: '2 Camera System',
                    description: '2-camera security system',
                    basePrice: 0,
                    image: '',
                    variants: []
                  }, '2x-variant');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center flex justify-between items-center"
              >
                <span>2 Cameras</span>
                <span>$299</span>
              </button>
              
              <button
                onClick={() => {
                  handleAddToCart({
                    id: '3x-camera',
                    name: '3 Camera System',
                    description: '3-camera security system',
                    basePrice: 0,
                    image: '',
                    variants: []
                  }, '3x-variant');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center flex justify-between items-center"
              >
                <span>3 Cameras</span>
                <span>$449</span>
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add-ons</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleAddToCart({
                    id: 'storage-1tb',
                    name: '1TB Storage',
                    description: 'Additional 1TB storage for recordings',
                    basePrice: 0,
                    image: '',
                    variants: []
                  }, 'storage-1tb')}
                  className="w-full border rounded-lg p-3 text-left flex items-center hover:bg-gray-50"
                >
                  <svg className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <div className="flex-1">
                    <div className="font-medium">1TB Storage</div>
                    <div className="text-sm text-gray-500">$49.99</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddToCart({
                    id: 'extended-warranty',
                    name: 'Extended Warranty',
                    description: '3-year extended warranty',
                    basePrice: 0,
                    image: '',
                    variants: []
                  }, 'warranty-3yr')}
                  className="w-full border rounded-lg p-3 text-left flex items-center hover:bg-gray-50"
                >
                  <svg className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div className="flex-1">
                    <div className="font-medium">3-Year Warranty</div>
                    <div className="text-sm text-gray-500">$79.99</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddToCart({
                    id: 'professional-install',
                    name: 'Professional Installation',
                    description: 'Professional installation service',
                    basePrice: 0,
                    image: '',
                    variants: []
                  }, 'install-pro')}
                  className="w-full border rounded-lg p-3 text-left flex items-center hover:bg-gray-50"
                >
                  <svg className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <div className="flex-1">
                    <div className="font-medium">Professional Installation</div>
                    <div className="text-sm text-gray-500">$199.99</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {appState === 'addons' && checkoutSteps.length > 0 && (
          <div className="w-full h-full overflow-auto bg-white" style={{ minHeight: '135vh' }}>
            <div className="max-w-5xl mx-auto p-4">
              <style dangerouslySetInnerHTML={{
                __html: `
                  body { margin: 0; padding: 0; }
                  * { box-sizing: border-box; }
                  #root { height: 100%; }
                `
              }} />
              <div className="mb-4">
                <Button
                  variant="ghost"
                  onClick={() => setAppState('products')}
                  className="text-gray-600 hover:text-gray-900 p-2 -ml-2 text-sm"
                  size="sm"
                >
                  ← Back to Selection
                </Button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Add-ons & Accessories
                </h2>
                <p className="text-xs text-gray-500">
                  Enhance your camera system
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {/* Wireless Mouse */}
                <div className="text-center p-3 hover:bg-blue-50 rounded-lg transition-colors">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">🖱️</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">Wireless Mouse</h4>
                  <p className="text-gray-600 text-xs mb-2">Remote control</p>
                  <div className="text-lg font-bold text-blue-600 mb-2">$29</div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                    onClick={() => {
                      updateProductSelection({
                        id: 'wireless-mouse',
                        name: 'Wireless Mouse',
                        description: 'Remote control mouse for camera system',
                        basePrice: 0,
                        image: '',
                        variants: []
                      }, 'mouse-variant');
                    }}
                  >
                    Add
                  </Button>
                </div>

                {/* HDMI Cables */}
                <div className="text-center p-3 hover:bg-blue-50 rounded-lg transition-colors">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">🔌</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">HDMI Cables</h4>
                  <p className="text-gray-600 text-xs mb-2">3-pack</p>
                  <div className="text-lg font-bold text-blue-600 mb-2">$45</div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                    onClick={() => {
                      updateProductSelection({
                        id: 'hdmi-cables',
                        name: 'HDMI Cables (3-pack)',
                        description: 'High-quality HDMI connection cables',
                        basePrice: 0,
                        image: '',
                        variants: []
                      }, 'cables-variant');
                    }}
                  >
                    Add
                  </Button>
                </div>

                {/* Power Adapter */}
                <div className="text-center p-3 hover:bg-blue-50 rounded-lg transition-colors">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">⚡</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">Power Kit</h4>
                  <p className="text-gray-600 text-xs mb-2">Backup supply</p>
                  <div className="text-lg font-bold text-blue-600 mb-2">$79</div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                    onClick={() => {
                      updateProductSelection({
                        id: 'power-adapter',
                        name: 'Power Adapter Kit',
                        description: 'Backup power supply for camera system',
                        basePrice: 0,
                        image: '',
                        variants: []
                      }, 'adapter-variant');
                    }}
                  >
                    Add
                  </Button>
                </div>

                {/* Memory Card */}
                <div className="text-center p-3 hover:bg-blue-50 rounded-lg transition-colors">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">💾</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">128GB Card</h4>
                  <p className="text-gray-600 text-xs mb-2">Storage</p>
                  <div className="text-lg font-bold text-blue-600 mb-2">$39</div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                    onClick={() => {
                      updateProductSelection({
                        id: 'memory-card',
                        name: '128GB Memory Card',
                        description: 'Extended storage for camera recordings',
                        basePrice: 0,
                        image: '',
                        variants: []
                      }, 'memory-variant');
                    }}
                  >
                    Add
                  </Button>
                </div>

                {/* Mounting Kit */}
                <div className="text-center p-3 hover:bg-blue-50 rounded-lg transition-colors">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">🔧</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">Mounting Kit</h4>
                  <p className="text-gray-600 text-xs mb-2">Hardware</p>
                  <div className="text-lg font-bold text-blue-600 mb-2">$25</div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                    onClick={() => {
                      updateProductSelection({
                        id: 'mounting-kit',
                        name: 'Mounting Kit',
                        description: 'Professional mounting hardware for cameras',
                        basePrice: 0,
                        image: '',
                        variants: []
                      }, 'mount-variant');
                    }}
                  >
                    Add
                  </Button>
                </div>

                {/* Extension Cable */}
                <div className="text-center p-3 hover:bg-blue-50 rounded-lg transition-colors">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl">📏</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">10ft Cable</h4>
                  <p className="text-gray-600 text-xs mb-2">Extension</p>
                  <div className="text-lg font-bold text-blue-600 mb-2">$19</div>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                    onClick={() => {
                      updateProductSelection({
                        id: 'extension-cable',
                        name: 'Extension Cable (10ft)',
                        description: 'Extra cable length for camera installation',
                        basePrice: 0,
                        image: '',
                        variants: []
                      }, 'cable-variant');
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="mt-6 text-center border-t border-gray-100 pt-6">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm w-full max-w-xs"
                  onClick={() => setAppState('order-summary')}
                >
                  Continue to Order
                </Button>
                <p className="text-xs text-gray-500 mt-2">Add more items or continue to checkout</p>
              </div>
              <style dangerouslySetInnerHTML={{
                __html: `
                  body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                  }
                  * {
                    box-sizing: border-box;
                  }
                  #root {
                    height: 100%;
                  }
                `
              }} />
            </div>
          </div>
        )}

        {appState === 'order-summary' && (
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Button
                  variant="ghost"
                  onClick={() => setAppState('addons')}
                  className="mb-4 text-gray-600 hover:text-gray-900"
                >
                  ← Back to Add-ons
                </Button>
              </div>

              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Order Summary
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Review your selections before proceeding to checkout
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Order Items */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Your Order</h3>

                  {/* This will be populated from the cart */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">Camera system and add-ons will appear here...</p>
                    <p className="text-sm text-gray-500 mt-2">Items are managed in your cart</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Order Total</h4>
                    <p className="text-2xl font-bold text-blue-600">$0.00</p>
                    <p className="text-sm text-gray-600 mt-1">Total will be calculated from cart items</p>
                  </div>
                </div>

                {/* Order Actions */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Ready to Checkout?</h3>

                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span>Camera System</span>
                        <span className="font-semibold">$299.00+</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span>Add-ons & Accessories</span>
                        <span className="font-semibold">$0.00</span>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-blue-600">$299.00+</span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                          onClick={() => {
                            // Redirect to Shopify checkout
                            const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
                            if (storeDomain) {
                              window.location.href = `https://${storeDomain}/checkout`;
                            } else {
                              setAppState('complete');
                            }
                          }}
                        >
                          Proceed to Checkout
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setAppState('addons')}
                        >
                          Add More Items
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">What's Next?</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Review your order details</li>
                      <li>• Choose shipping options</li>
                      <li>• Complete payment securely</li>
                      <li>• Receive installation guide</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};

export default Index;
