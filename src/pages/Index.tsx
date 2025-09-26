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
  const { shopifyCart, updateProductSelection, setAllAddOns, isLoading, error, addVariantToCart, loadCart, getOrderSummary, getCheckoutUrl } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [checkoutSteps, setCheckoutSteps] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCameraType, setSelectedCameraType] = useState<CameraType | null>(null);
  const [selectedCameraLevel, setSelectedCameraLevel] = useState<CameraLevel | null>(null);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');

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

  // Load add-on products when entering the addons step
  useEffect(() => {
    const loadAddOns = async () => {
      if (appState !== 'addons') return;
      setLoadingProducts(true);
      try {
        console.log('[Index] Loading add-on products (addons step)');
        const addOnCollectionId = 'gid://shopify/Collection/672209174854';
        let addOnProducts: Product[] = [] as any;
        try {
          const byId = await ShopifyProductService.getProductsByCollection(addOnCollectionId);
          if (byId && byId.length > 0) {
            addOnProducts = byId as any;
            console.log(`[Index] Loaded ${byId.length} add-on products via ID`);
          }
        } catch (e) {
          console.warn('[Index] Add-on lookup by ID failed:', e);
        }

        if (addOnProducts.length === 0) {
          const handles = ['add-extras', 'add-ons', 'addons', 'extras', 'extra', 'accessories', 'add'];
          for (const h of handles) {
            try {
              console.log('[Index] Trying add-on collection handle:', h);
              const byHandle = await ShopifyProductService.getProductsByCollection(h);
              if (byHandle && byHandle.length > 0) {
                addOnProducts = byHandle as any;
                console.log(`[Index] Loaded ${byHandle.length} add-on products via handle: ${h}`);
                break;
              }
            } catch (err) {
              console.warn('[Index] Add-on handle failed:', h, err);
            }
          }
        }

        setProducts(addOnProducts as any);
      } catch (error) {
        console.error('[Index] Error loading add-on products:', error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadAddOns();
  }, [appState]);

  // Keep order summary in sync when entering order-summary or when cart updates
  useEffect(() => {
    const syncSummary = async () => {
      if (appState !== 'order-summary') return;
      try {
        if (shopifyCart?.id) {
          await loadCart(shopifyCart.id);
        }
        const summary = await getOrderSummary();
        setOrderSummary(summary);
        if (!checkoutUrl) {
          const url = await getCheckoutUrl();
          if (url) setCheckoutUrl(url);
        }
      } catch (e) {
        console.error('[Index] Failed to load order summary:', e);
        setOrderSummary(null);
      }
    };
    syncSummary();
  }, [appState, shopifyCart]);

  const testShopifyConnection = async () => {
    console.log('[Index] Testing Shopify connection...');
    try {
      const collections = await ShopifyProductService.getCollections();
      console.log('[Index] Collections test result:', collections);

      if (collections.length > 0) {
        console.log('[Index] ✅ Shopify API is working! Found collections:');
        collections.forEach((collection, index) => {
          console.log(`  ${index + 1}. ID: ${collection.id}`);
          console.log(`     Title: ${collection.title}`);
          console.log(`     Handle: ${collection.handle}`);
          console.log(`     Description: ${collection.description || 'N/A'}`);
          console.log('     ---');
        });

        // Test the specific product mentioned by user
        console.log('[Index] Testing specific product: 15163348975942');
        try {
          const specificProduct = await ShopifyProductService.testSpecificProduct('15163348975942');
          if (specificProduct) {
            console.log('[Index] ✅ Specific product found:', {
              id: specificProduct.id,
              title: specificProduct.title,
              handle: specificProduct.handle,
              publishedAt: specificProduct.publishedAt,
              availableForSale: specificProduct.availableForSale,
              collections: specificProduct.collections?.edges?.map((c: any) => ({
                title: c.node.title,
                handle: c.node.handle
              })),
              hasImages: specificProduct.images?.edges?.length > 0,
              variants: specificProduct.variants?.edges?.length || 0
            });

            if (!specificProduct.availableForSale) {
              console.log('[Index] ❌ Product is not available for sale!');
            }

            if (!specificProduct.publishedAt) {
              console.log('[Index] ❌ Product is not published!');
            }
          } else {
            console.log('[Index] ❌ Specific product not found or not accessible');
          }
        } catch (productError) {
          console.error('[Index] ❌ Failed to test specific product:', productError);
        }

        // Test fetching products from each collection that might contain products
        const productCollections = collections.filter(c =>
          c.title.toLowerCase().includes('entry') ||
          c.title.toLowerCase().includes('mid') ||
          c.title.toLowerCase().includes('high') ||
          c.title.toLowerCase().includes('level') ||
          c.title.toLowerCase().includes('range') ||
          c.title.toLowerCase().includes('add') ||
          c.title.toLowerCase().includes('extra')
        );

        if (productCollections.length > 0) {
          console.log(`[Index] Found ${productCollections.length} potential product collections. Testing each:`);

          for (const collection of productCollections) {
            try {
              console.log(`[Index] Testing product fetch from: ${collection.title} (handle: ${collection.handle})`);
              const products = await ShopifyProductService.getProductsByCollection(collection.handle);

              if (products.length > 0) {
                console.log(`[Index] ✅ SUCCESS: Found ${products.length} products in ${collection.title}!`);
                console.log('Sample product:', {
                  id: products[0].id,
                  name: products[0].name,
                  basePrice: products[0].basePrice,
                  variants: products[0].variants.length,
                  image: products[0].image ? 'Has image' : 'No image'
                });
                break; // Stop at first successful collection
              } else {
                console.log(`[Index] ⚠️ No products found in ${collection.title}`);
              }
            } catch (productError) {
              console.error(`[Index] ❌ Failed to fetch products from ${collection.title}:`, productError.message);
            }
          }
        } else {
          console.log('[Index] No collections found that might contain products. Testing all collections:');
          // Test all collections if no obvious product collections found
          for (const collection of collections.slice(0, 3)) { // Test first 3
            try {
              console.log(`[Index] Testing: ${collection.title} (handle: ${collection.handle})`);
              const products = await ShopifyProductService.getProductsByCollection(collection.handle);

              if (products.length > 0) {
                console.log(`[Index] ✅ SUCCESS: Found ${products.length} products in ${collection.title}!`);
                break;
              }
            } catch (e) {
              console.log(`[Index] Failed to test ${collection.title}:`, e.message);
            }
          }
        }

        alert(`✅ Shopify API is working! Found ${collections.length} collections. Check console for detailed results.`);
      } else {
        console.log('[Index] ❌ No collections found. Check API credentials and permissions.');
        alert('❌ No collections found. Check API credentials and permissions.');
      }
    } catch (error) {
      console.error('[Index] ❌ Shopify API test failed:', error);
      alert(`❌ Shopify API test failed: ${error.message}`);
    }
  };

  // Helper: add first available variant from a Shopify collection handle
  const addFromCollectionHandle = async (handle: string, quantity: number = 1) => {
    console.log('[Index] Adding from collection handle:', handle, 'qty:', quantity);
    const variantId = await ShopifyProductService.getFirstVariantIdFromCollectionHandle(handle);
    console.log('[Index] Resolved variantId:', variantId);
    if (!variantId) {
      alert(`No available product found in ${handle.replace('-', ' ')} collection.`);
      return false;
    }
    const ok = await addVariantToCart(variantId, quantity);
    if (!ok) alert('Failed to add item to cart.');
    return ok;
  };

  const handleCameraTypeSelect = (cameraType: CameraType) => {
    setSelectedCameraType(cameraType);
    setAppState('camera-level');
  };

  const handleCameraLevelSelect = async (cameraLevel: CameraLevel) => {
    setSelectedCameraLevel(cameraLevel);
    setLoadingProducts(true); // Set loading state

    try {
      // First, get all collections to find the correct handles
      console.log('[Index] Fetching all collections to find correct handles...');
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

      const targetCollection = levelCollectionMap[cameraLevel];
      console.log(`[Index] Looking for ${cameraLevel} level collection:`, targetCollection);

      if (targetCollection) {
        console.log(`[Index] Found collection: ${targetCollection.title} (handle: ${targetCollection.handle})`);
        const products = await ShopifyProductService.getProductsByCollection(targetCollection.handle);

        if (products.length > 0) {
          setProducts(products);
          console.log(`[Index] ✅ Successfully loaded ${products.length} products from ${targetCollection.title}`);
        } else {
          console.log(`[Index] ⚠️ Collection ${targetCollection.title} has no products, trying fallback handles...`);

          // Fallback to hardcoded handles if collection exists but has no products
          const fallbackHandles = {
            entry: ['entry-level', 'entrylevel', 'entry', 'basic'],
            mid: ['mid-range', 'midrange', 'mid', 'standard'],
            high: ['high-end', 'highend', 'high', 'premium']
          };

          for (const handle of fallbackHandles[cameraLevel] || []) {
            try {
              console.log(`[Index] Trying fallback handle: ${handle}`);
              const fallbackProducts = await ShopifyProductService.getProductsByCollection(handle);
              if (fallbackProducts.length > 0) {
                setProducts(fallbackProducts);
                console.log(`[Index] ✅ Found ${fallbackProducts.length} products using fallback handle: ${handle}`);
                break;
              }
            } catch (e) {
              console.log(`[Index] Fallback handle ${handle} failed:`, e.message);
            }
          }
        }
      } else {
        console.error(`[Index] ❌ No collection found for level: ${cameraLevel}`);
        setProducts([]);
        alert(`No collection found for ${cameraLevel} level. Please check your Shopify collections.`);
      }
    } catch (error) {
      console.error('[Index] Error loading collection products:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false); // Always clear loading state
    }

    // Move to products step
    setAppState('products');
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    // This function can be used to update quantities if needed
    console.log(`Quantity changed for ${productId}: ${newQuantity}`);
  };

  const handleAddToCart = async (product: Product, variantId: string) => {
    // For products: Add to cart in background and proceed immediately
    updateProductSelection(product, variantId).catch(error => {
      console.error('[Index] Background cart addition failed:', error);
    });

    // Immediately proceed to next step
    setAppState('addons');
  };

  // Simple icon chooser by product name keywords
  const getIconForProduct = (name?: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('mouse')) return '🖱️';
    if (n.includes('hdmi') || n.includes('cable')) return '🔌';
    if (n.includes('power') || n.includes('adapter') || n.includes('kit')) return '⚡';
    if (n.includes('card') || n.includes('storage') || n.includes('sd')) return '💾';
    if (n.includes('mount') || n.includes('bracket')) return '🔧';
    if (n.includes('camera')) return '📷';
    return '🛒';
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
    <div className="min-h-screen bg-white overflow-x-hidden">
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
          <div className="max-w-sm mx-auto p-4">
            <div className="space-y-3">
              {cameraTypes.map((cameraType) => {
                const icons = {
                  residential: '🏠',
                  rural: '🌾',
                  industrial: '🏭'
                };
                const descriptions = {
                  residential: 'Perfect for homes and apartments',
                  rural: 'Ideal for farms and countryside',
                  industrial: 'Heavy-duty for commercial use'
                };
                const features = {
                  residential: ['HD Quality', 'Easy Setup', 'Smart Features'],
                  rural: ['Weatherproof', 'Long Range', 'Solar Ready'],
                  industrial: ['4K Ultra HD', '24/7 Monitoring', 'Enterprise Grade']
                };

                return (
                  <button
                    key={cameraType.type}
                    onClick={() => handleCameraTypeSelect(cameraType.type)}
                    className="w-full group"
                  >
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg transition-all duration-300 group-hover:bg-blue-50">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                          {icons[cameraType.type as keyof typeof icons]}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {cameraType.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {descriptions[cameraType.type as keyof typeof descriptions]}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {features[cameraType.type as keyof typeof features].map((feature, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-blue-600 group-hover:translate-x-1 transition-transform duration-300">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {appState === 'camera-level' && selectedCameraType && (
          <div className="max-w-sm mx-auto p-4">
            <div className="mb-3">
              <button
                onClick={() => {
                  setAppState('camera-type');
                  setSelectedCameraType(null);
                }}
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center mb-2"
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>

            <div className="space-y-3">
              {cameraLevels.map((cameraLevel) => {
                const icons = {
                  entry: '🌟',
                  mid: '⭐',
                  high: '💎'
                };
                const descriptions = {
                  entry: 'Perfect for getting started with basic security',
                  mid: 'Balanced performance for everyday protection',
                  high: 'Premium quality for maximum security coverage'
                };
                const features = {
                  entry: ['720p HD', 'Motion Detection', 'Mobile App'],
                  mid: ['1080p Full HD', 'Night Vision', 'Cloud Storage'],
                  high: ['4K Ultra HD', 'AI Analytics', 'Professional Installation']
                };
                const colors = {
                  entry: 'border-green-200 hover:border-green-500 bg-green-50',
                  mid: 'border-blue-200 hover:border-blue-500 bg-blue-50',
                  high: 'border-purple-200 hover:border-purple-500 bg-purple-50'
                };

                return (
                  <button
                    key={cameraLevel.level}
                    onClick={() => handleCameraLevelSelect(cameraLevel.level)}
                    className="w-full group"
                  >
                    <div className={`bg-white border-2 ${colors[cameraLevel.level as keyof typeof colors]} rounded-xl p-4 hover:shadow-lg transition-all duration-300`}>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                          {icons[cameraLevel.level as keyof typeof icons]}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {cameraLevel.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {descriptions[cameraLevel.level as keyof typeof descriptions]}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {features[cameraLevel.level as keyof typeof features].map((feature, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-white bg-opacity-80 text-gray-800 text-xs px-2 py-0.5 rounded-full border"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-gray-600 group-hover:translate-x-1 transition-transform duration-300">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
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
              Select Products from Collection
            </h2>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6 text-center">
              <p className="text-blue-800">
                Selected: <strong>{selectedCameraType}</strong> - <strong>{selectedCameraLevel}</strong> Range
              </p>
              <p className="text-sm text-blue-700 mt-2">Browse and select products from the collection below.</p>
            </div>

            {loadingProducts ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-1.5 max-w-sm mx-auto">
                {products.map((product) => {
                  const firstVariantId = (product as any).variants?.[0]?.id;
                  const firstVariantName = (product as any).variants?.[0]?.name || (product as any).variants?.[0]?.title;
                  return (
                    <div key={product.id} className="px-2 py-1.5 border rounded flex items-center justify-between hover:bg-gray-50">
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-left flex-1 min-w-0"
                        onClick={() => firstVariantId && handleAddToCart(product, firstVariantId)}
                      >
                        <span className="text-lg flex-shrink-0">
                          {getIconForProduct((product as any).name || (product as any).title)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">
                            {(product as any).name || (product as any).title}
                          </div>
                          {firstVariantName && (
                            <div className="text-xs text-gray-500 truncate">{firstVariantName}</div>
                          )}
                        </div>
                      </button>
                      <Button
                        size="sm"
                        className="h-6 px-1.5 text-xs flex-shrink-0 ml-1"
                        onClick={() => firstVariantId && handleAddToCart(product, firstVariantId)}
                        disabled={!firstVariantId}
                      >
                        Add
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-600">
                <p>No products found in this collection.</p>
                <p className="text-xs mt-1">Please check if the collection exists and has products.</p>
              </div>
            )}
          </div>
        )}

        {appState === 'addons' && checkoutSteps.length > 0 && (
          <div className="w-full min-h-screen bg-white overflow-x-hidden">
            <div className="max-w-sm mx-auto p-3">
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
                  Add-ons & Accessories from Shopify
                </h2>
                <p className="text-xs text-gray-500">Products are fetched from your add-ons collection</p>
              </div>

              <div className="max-w-sm mx-auto px-2">
                {loadingProducts ? (
                  <div className="text-center py-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-xs text-gray-600">Loading...</p>
                  </div>
                ) : products.length > 0 ? (
                  <div className="space-y-1">
                    {products.map((product) => {
                      const firstVariantId = (product as any).variants?.[0]?.id;
                      return (
                        <div key={product.id} className="px-2 py-1.5 border rounded flex items-center justify-between hover:bg-gray-50">
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-left flex-1 min-w-0"
                            onClick={() => firstVariantId && handleAddToCart(product, firstVariantId)}
                          >
                            <span className="text-lg flex-shrink-0">
                              {getIconForProduct((product as any).name || (product as any).title)}
                            </span>
                            <span className="text-xs font-medium truncate">
                              {(product as any).name || (product as any).title}
                            </span>
                          </button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-1.5 text-xs flex-shrink-0 ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              firstVariantId && handleAddToCart(product, firstVariantId);
                            }}
                            disabled={!firstVariantId}
                          >
                            Add
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-3 text-xs text-gray-500">
                    No add-ons available.
                  </div>
                )}
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
                  {orderSummary && orderSummary.items && orderSummary.items.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {orderSummary.items.map((item: any, idx: number) => (
                          <div key={idx} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            </div>
                            <div className="font-semibold">${item.price.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg mt-4">
                        <h4 className="font-semibold mb-2">Totals</h4>
                        <div className="flex items-center justify-between">
                          <span>Subtotal</span>
                          <span className="font-medium">${orderSummary.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tax</span>
                          <span className="font-medium">${orderSummary.tax.toFixed(2)}</span>
                        </div>
                        <div className="border-t mt-3 pt-3 flex items-center justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-blue-600">${orderSummary.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-600">Your cart is empty.</p>
                      <p className="text-sm text-gray-500 mt-2">Add items to see them here.</p>
                    </div>
                  )}
                </div>

                {/* Order Actions */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Ready to Checkout?</h3>

                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="space-y-4">
                      {orderSummary ? (
                        <>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span>Subtotal</span>
                            <span className="font-semibold">${orderSummary.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span>Tax</span>
                            <span className="font-semibold">${orderSummary.tax.toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between text-lg font-bold">
                              <span>Total</span>
                              <span className="text-blue-600">${orderSummary.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">Cart totals unavailable</div>
                      )}

                      <div className="space-y-3 pt-4">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                          onClick={async () => {
                            // Prefer Shopify checkoutUrl if we have it
                            let url = checkoutUrl;
                            if (!url) {
                              url = await getCheckoutUrl();
                            }
                            if (url) {
                              window.location.href = url;
                            } else {
                              const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
                              if (storeDomain) {
                                window.location.href = `https://${storeDomain}/checkout`;
                              } else {
                                setAppState('complete');
                              }
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
