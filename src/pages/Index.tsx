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

  return (
    <div className="min-h-screen bg-white">
      {/* Hide Shopify's default header */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .shopify-section-header { display: none !important; }
          header[class*="shopify"] { display: none !important; }
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

      {/* Announcement Bar */}
      <div className="bg-blue-600 text-white py-1.5 px-4 text-center relative z-50">
        <p className="font-bold text-xs md:text-sm uppercase tracking-wide">
          📹 Professional CCTV Camera Systems - 10% OFF ON YOUR ENTIRE ORDER USE CODE CAMERA10 AT CHECKOUT 📹
        </p>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative" style={{ position: 'relative', zIndex: 10 }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-36">
            {/* Left Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                Home
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                Products
              </a>
              <div className="relative group">
                <button className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors flex items-center">
                  Solutions
                  <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Residential Security</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Rural Surveillance</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Industrial Monitoring</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Smart Analytics</a>
                  </div>
                </div>
              </div>
              <a href="#" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                Support
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                Installation
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
                Contact
              </a>
            </nav>

            {/* Centered Logo - CCTV Text Branding */}
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">📹</span>
                  </div>
                  <h1 className="text-2xl font-bold text-blue-600 tracking-wider">
                    CCTV PRO
                  </h1>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Professional Security Systems
                </p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                <User className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile menu button - Single Button Only */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-gray-900"
              >
                {isMobileMenuOpen ? <X className="h-12 w-12" /> : <Menu className="h-12 w-12" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a
                  href="#"
                  className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors"
                  onClick={closeMobileMenu}
                >
                  Home
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors"
                  onClick={closeMobileMenu}
                >
                  Products
                </a>
                <div className="relative">
                  <button className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors w-full text-left">
                    Solutions
                  </button>
                  <div className="pl-6 mt-1 space-y-1">
                    <a href="#" className="block px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Residential Security</a>
                    <a href="#" className="block px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Rural Surveillance</a>
                    <a href="#" className="block px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Industrial Monitoring</a>
                    <a href="#" className="block px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Smart Analytics</a>
                  </div>
                </div>
                <a
                  href="#"
                  className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors"
                  onClick={closeMobileMenu}
                >
                  Support
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors"
                  onClick={closeMobileMenu}
                >
                  Installation
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors"
                  onClick={closeMobileMenu}
                >
                  Contact
                </a>
              </div>
              <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Mobile action buttons removed - using desktop ones only */}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-blue-50">
        {appState === 'camera-type' && (
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Choose Your Camera Type
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Select the camera type that best fits your security needs
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {cameraTypes.map((cameraType) => (
                  <div
                    key={cameraType.type}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCameraTypeSelect(cameraType.type)}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-4">{cameraType.icon}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {cameraType.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {cameraType.description}
                      </p>
                      <Button className="w-full">
                        Select {cameraType.title}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {appState === 'camera-level' && selectedCameraType && (
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAppState('camera-type');
                    setSelectedCameraType(null);
                  }}
                  className="mb-4 text-gray-600 hover:text-gray-900"
                >
                  ← Back to Camera Type Selection
                </Button>
              </div>

              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Choose Your Camera Range
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Select the camera range that matches your requirements and budget
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {cameraLevels.map((cameraLevel) => (
                  <div
                    key={cameraLevel.level}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCameraLevelSelect(cameraLevel.level)}
                  >
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {cameraLevel.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {cameraLevel.description}
                      </p>
                      <div className="mb-4">
                        <ul className="text-sm text-gray-600 space-y-1">
                          {cameraLevel.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <span className="text-blue-500 mr-2">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button className="w-full">
                        Select {cameraLevel.title}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {appState === 'products' && selectedCameraType && selectedCameraLevel && (
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAppState('camera-level');
                    setSelectedCameraLevel(null);
                  }}
                  className="mb-4 text-gray-600 hover:text-gray-900"
                >
                  ← Back to Camera Range Selection
                </Button>
              </div>

              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Camera Selection
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Choose your perfect camera from our {selectedCameraType} {selectedCameraLevel} range collection
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 2x Camera Package */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📹</span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">2x Camera Package</h4>
                    <p className="text-gray-600 text-sm mb-4">Perfect for small properties</p>
                    <div className="text-2xl font-bold text-blue-600 mb-4">$299</div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Quantity</label>
                      <div className="flex items-center justify-center mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange('2x-camera', 1)}
                          className="h-8 w-8 p-0"
                        >
                          <span>-</span>
                        </Button>
                        <span className="px-4 py-2 bg-gray-100 rounded text-sm font-medium min-w-[3rem] text-center">
                          1
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange('2x-camera', 2)}
                          className="h-8 w-8 p-0"
                        >
                          <span>+</span>
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleAddToCart({
                        id: '2x-camera',
                        name: '2x Camera Package',
                        description: 'Complete 2-camera security system'
                      }, '2x-variant')}
                    >
                      Add to Cart - $299
                    </Button>
                  </div>
                </div>

                {/* 3x Camera Package */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📹📹📹</span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">3x Camera Package</h4>
                    <p className="text-gray-600 text-sm mb-4">Ideal for medium properties</p>
                    <div className="text-2xl font-bold text-blue-600 mb-4">$449</div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Quantity</label>
                      <div className="flex items-center justify-center mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange('3x-camera', 1)}
                          className="h-8 w-8 p-0"
                        >
                          <span>-</span>
                        </Button>
                        <span className="px-4 py-2 bg-gray-100 rounded text-sm font-medium min-w-[3rem] text-center">
                          1
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange('3x-camera', 2)}
                          className="h-8 w-8 p-0"
                        >
                          <span>+</span>
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleAddToCart({
                        id: '3x-camera',
                        name: '3x Camera Package',
                        description: 'Complete 3-camera security system'
                      }, '3x-variant')}
                    >
                      Add to Cart - $449
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-8">
                <h5 className="font-semibold mb-2">Package Includes:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Professional-grade CCTV cameras</li>
                  <li>• Weather-resistant housing</li>
                  <li>• Night vision capability</li>
                  <li>• Motion detection</li>
                  <li>• Mobile app access</li>
                  <li>• Professional installation guide</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {appState === 'addons' && checkoutSteps.length > 0 && (
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <Button
                  variant="ghost"
                  onClick={() => setAppState('products')}
                  className="mb-4 text-gray-600 hover:text-gray-900"
                >
                  ← Back to Camera Selection
                </Button>
              </div>

              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Add-ons & Accessories
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Enhance your camera system with additional accessories
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Wireless Mouse */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🖱️</span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">Wireless Mouse</h4>
                    <p className="text-gray-600 text-sm mb-4">Control your system remotely</p>
                    <div className="text-2xl font-bold text-blue-600 mb-4">$29</div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      // Add mouse to cart
                      updateProductSelection({
                        id: 'wireless-mouse',
                        name: 'Wireless Mouse',
                        description: 'Remote control mouse for camera system'
                      }, 'mouse-variant');
                    }}
                  >
                    Add to Cart - $29
                  </Button>
                </div>

                {/* HDMI Cables */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🔌</span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">HDMI Cables (3-pack)</h4>
                    <p className="text-gray-600 text-sm mb-4">High-quality connection cables</p>
                    <div className="text-2xl font-bold text-blue-600 mb-4">$45</div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      // Add cables to cart
                      updateProductSelection({
                        id: 'hdmi-cables',
                        name: 'HDMI Cables (3-pack)',
                        description: 'High-quality HDMI connection cables'
                      }, 'cables-variant');
                    }}
                  >
                    Add to Cart - $45
                  </Button>
                </div>

                {/* Power Adapter */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">Power Adapter Kit</h4>
                    <p className="text-gray-600 text-sm mb-4">Backup power supply system</p>
                    <div className="text-2xl font-bold text-blue-600 mb-4">$79</div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      // Add power adapter to cart
                      updateProductSelection({
                        id: 'power-adapter',
                        name: 'Power Adapter Kit',
                        description: 'Backup power supply for camera system'
                      }, 'adapter-variant');
                    }}
                  >
                    Add to Cart - $79
                  </Button>
                </div>

                {/* Memory Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">💾</span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">128GB Memory Card</h4>
                    <p className="text-gray-600 text-sm mb-4">Extended storage capacity</p>
                    <div className="text-2xl font-bold text-blue-600 mb-4">$39</div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      // Add memory card to cart
                      updateProductSelection({
                        id: 'memory-card',
                        name: '128GB Memory Card',
                        description: 'Extended storage for camera recordings'
                      }, 'memory-variant');
                    }}
                  >
                    Add to Cart - $39
                  </Button>
                </div>

                {/* Mounting Kit */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🔧</span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">Mounting Kit</h4>
                    <p className="text-gray-600 text-sm mb-4">Professional mounting hardware</p>
                    <div className="text-2xl font-bold text-blue-600 mb-4">$25</div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      // Add mounting kit to cart
                      updateProductSelection({
                        id: 'mounting-kit',
                        name: 'Mounting Kit',
                        description: 'Professional mounting hardware for cameras'
                      }, 'mount-variant');
                    }}
                  >
                    Add to Cart - $25
                  </Button>
                </div>

                {/* Extension Cable */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📏</span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">Extension Cable (10ft)</h4>
                    <p className="text-gray-600 text-sm mb-4">Extra reach for installation</p>
                    <div className="text-2xl font-bold text-blue-600 mb-4">$19</div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      // Add extension cable to cart
                      updateProductSelection({
                        id: 'extension-cable',
                        name: 'Extension Cable (10ft)',
                        description: 'Extra cable length for camera installation'
                      }, 'cable-variant');
                    }}
                  >
                    Add to Cart - $19
                  </Button>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                  onClick={() => setAppState('order-summary')}
                >
                  Continue to Order Summary
                </Button>
              </div>
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

      {/* Footer */}
      <footer className="bg-blue-900 text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Products
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Solutions
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Installation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Our Service */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Our Service</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Professional CCTV camera systems for residential, rural, and industrial applications. We provide complete security solutions with installation and support.
              </p>
            </div>

            {/* Contact Us */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Contact Us</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p className="font-medium">Professional Security Systems Inc.</p>
                <p>123 Security Blvd, Suite 100</p>
                <p>New York, NY 10001</p>
                <p className="font-medium">1-800-SECURE-1</p>
                <p>support@securitycameras.com</p>
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Warranty Information
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Installation Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-blue-700 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-300">
                © 2024 Professional CCTV Camera Systems. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
