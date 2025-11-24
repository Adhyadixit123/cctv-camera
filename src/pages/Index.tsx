import { useState, useEffect, useRef } from 'react';
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
  // Cache the products shown in Step 3 so we can restore them when returning from Step 4
  const [savedProductsBeforeAddons, setSavedProductsBeforeAddons] = useState<Product[] | null>(null);
  const prevAppStateRef = useRef<AppState>(appState);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Track appState transitions to cache/restore products between Step 3 and Step 4
  useEffect(() => {
    const prev = prevAppStateRef.current;
    // When entering addons from products, cache the current products (Step 3 collection)
    if (appState === 'addons' && prev === 'products' && products?.length) {
      setSavedProductsBeforeAddons(products);
    }
    // When returning to products from addons, restore previously cached products
    if (appState === 'products' && prev === 'addons' && savedProductsBeforeAddons) {
      setProducts(savedProductsBeforeAddons);
    }
    prevAppStateRef.current = appState;
  }, [appState, products, savedProductsBeforeAddons]);
  
  // Get cart quantities for products
  const getCartQuantity = (productId: string) => {
    if (!shopifyCart?.lines?.edges) return 0;
    
    const lineItem = shopifyCart.lines.edges.find(
      (edge: any) => edge.node.merchandise?.product?.id === productId
    );
    
    return lineItem ? lineItem.node.quantity : 0;
  };

  useEffect(() => {
    if (appState === 'camera-type' && shopifyCart?.lines?.edges?.length) {
      setAppState('order-summary');
    }
  }, [appState, shopifyCart]);

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
    { type: 'rural', title: 'Commercial' },
    { type: 'industrial', title: 'Industrial' }
  ];

  const cameraLevels: { level: CameraLevel; title: string }[] = [
    { level: 'entry', title: 'Entry Level- Full HD System' },
    { level: 'mid', title: 'Mid-Range-6MP Ultra HD System' },
    { level: 'high', title: 'High End-4k system' }
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
          <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Premises</h2>
            <p className="text-sm text-gray-600 mb-6 text-center">What type of location is this?</p>

            <div className="grid gap-4 md:grid-cols-2">
              {cameraTypes.map((cameraType) => (
                <button
                  key={cameraType.type}
                  onClick={() => handleCameraTypeSelect(cameraType.type)}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                      {cameraType.type === 'residential' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{cameraType.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {cameraType.type === 'residential' 
                        ? 'Houses, flats, apartments' 
                        : cameraType.type === 'industrial'
                        ? 'Factories, plants, large-scale facilities, industrial complexes'
                        : 'Shops, offices, warehouses, retail units'}
                    </p>
                  </div>
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {appState === 'camera-level' && selectedCameraType && (
          <div className="max-w-2xl mx-auto p-6">
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

            <h2 className="text-3xl font-bold text-gray-900 mb-1 text-center">CCTV Range</h2>
            <p className="text-sm text-gray-600 mb-6 text-center"></p>
            
            <div className="mb-8 p-6 bg-gray-50 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-3">All systems include:</h3>
              <ul className="space-y-2 text-sm text-gray-700 inline-block text-left">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>1-5 years parts warranty</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Lifetime telephone advice</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>1 year labour warranty</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Professional installation</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4 max-w-md mx-auto">
              {cameraLevels.map((cameraLevel, index) => {
                // Define different icons for different levels
                const getIcon = () => {
                  switch (cameraLevel.level) {
                    case 'entry':
                      return (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      );
                    case 'mid':
                      return (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      );
                    case 'high':
                      return (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16a4 4 0 100-8 4 4 0 000 8z" />
                        </svg>
                      );
                    default:
                      return (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      );
                  }
                };

                const getDescription = () => {
                  switch (cameraLevel.level) {
                    case 'entry':
                      return 'Clear day & night vision, Ideal for smaller homes or budget-friendly setups';
                    case 'mid':
                      return 'Sharper details & wider coverage than Full HD  , Great for medium sized homes , shops or offices';
                    case 'high':
                      return 'Crystal clear details , even when zooming in  , Best for large properties  high security needs  or professional minitoring ';
                    default:
                      return 'Professional-grade security solution';
                  }
                };

                return (
                  <button
                    key={cameraLevel.level}
                    onClick={() => handleCameraLevelSelect(cameraLevel.level)}
                    className="group relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-left"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                          {getIcon()}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{cameraLevel.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {getDescription()}
                        </p>
                      </div>
                    </div>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </button>
                );
              })}
              
            </div>
          </div>
        )}

        {appState === 'products' && selectedCameraType && selectedCameraLevel && (
          <div className="max-w-5xl mx-auto p-6">
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

            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Select Products from Collection</h2>

            {loadingProducts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products from collection...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 justify-items-center">
                {products.map((product) => {
                  const quantityInCart = getCartQuantity(product.id);
                  return (
                    <div key={product.id} className="w-full max-w-xl">
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        size="lg"
                        cartQuantity={quantityInCart}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>No products found in this collection.</p>
                <p className="text-sm mt-2">Please check if the collection exists and has products.</p>
              </div>
            )}
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
                <p className="text-xs text-gray-500">Browse and select additional accessories</p>
              </div>

              {loadingProducts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading add-on products...</p>
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 justify-items-center">
                  {products
                    .filter(product => {
                      const quantityInCart = getCartQuantity(product.id);
                      // Show product if it's not in cart or allows multiple
                      const productTags = (product as any).tags || [];
                      return quantityInCart === 0 || productTags.includes('allow-multiple');
                    })
                    .map((product) => {
                      const quantityInCart = getCartQuantity(product.id);
                      return (
                        <div key={product.id} className="relative w-full max-w-xl">
                          {quantityInCart > 0 && (
                            <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center z-10">
                              {quantityInCart}
                            </div>
                          )}
                          <ProductCard 
                            product={product} 
                            onAddToCart={handleAddToCart} 
                            size="lg" 
                            cartQuantity={quantityInCart}
                            showQuantityInPrice={true}
                          />
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <p>No add-on products found.</p>
                  <p className="text-sm mt-2">Ensure the collection has published products available to Online Store.</p>
                </div>
              )}

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
                  /* Ensure Radix Select dropdowns can scroll even inside iframes/cards */
                  .select-content[data-state="open"] [data-radix-select-viewport] {
                    max-height: 18rem; /* 288px */
                    overflow-y: auto;
                  }
                  .select-content[data-state="open"] {
                    z-index: 9999 !important;
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
                            <div className="font-semibold">£{item.price.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg mt-4">
                        <h4 className="font-semibold mb-2">Totals</h4>
                        <div className="flex items-center justify-between">
                          <span>Subtotal</span>
                          <span className="font-medium">£{orderSummary.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tax</span>
                          <span className="font-medium">£{orderSummary.tax.toFixed(2)}</span>
                        </div>
                        <div className="border-t mt-3 pt-3 flex items-center justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-blue-600">£{orderSummary.total.toFixed(2)}</span>
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
                            <span className="font-semibold">£{orderSummary.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span>Tax</span>
                            <span className="font-semibold">£{orderSummary.tax.toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between text-lg font-bold">
                              <span>Total</span>
                              <span className="text-blue-600">£{orderSummary.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">Cart totals unavailable</div>
                      )}

                      <div className="space-y-3 pt-4">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 relative"
                          disabled={isCheckingOut}
                          onClick={async () => {
                            try {
                              setIsCheckingOut(true);
                              
                              // Function to perform the redirect
                              const redirectToCheckout = (url: string) => {
                                // If we're in an iframe, break out of it
                                if (window.self !== window.top) {
                                  window.top.location.href = url;
                                } else {
                                  window.location.href = url;
                                }
                              };
                              
                              // First try to get the checkout URL from the cart
                              let url = checkoutUrl;
                              
                              // If we don't have a checkout URL, try to get one
                              if (!url) {
                                url = await getCheckoutUrl();
                                if (url) {
                                  setCheckoutUrl(url);
                                }
                              }
                              
                              // If we have a URL, redirect to it
                              if (url) {
                                redirectToCheckout(url);
                                return;
                              }
                              
                              // Fallback to store domain if available
                              const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
                              if (storeDomain) {
                                // Try to get the cart ID from the current cart
                                const cartId = shopifyCart?.id;
                                const redirectUrl = cartId 
                                  ? `https://${storeDomain}/cart/${cartId.split('/').pop()}:1/checkout`
                                  : `https://${storeDomain}/checkout`;
                                
                                redirectToCheckout(redirectUrl);
                              } else {
                                console.error('Store domain not configured');
                                // If all else fails, show an error or fallback
                                alert('Unable to proceed to checkout. Store domain not configured.');
                              }
                            } catch (error) {
                              console.error('Checkout error:', error);
                              alert('An error occurred while processing your checkout. Please try again.');
                            } finally {
                              setIsCheckingOut(false);
                            }
                          }}
                        >
                          {isCheckingOut ? (
                            <>
                              <span className="opacity-0">Proceeding to Checkout</span>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              </div>
                            </>
                          ) : (
                            'Proceed to Checkout'
                          )}
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
