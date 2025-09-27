import { shopifyClient, ShopifyProduct } from '../lib/shopify';
import { Product } from '@/types/checkout';

export class ShopifyProductService {
  static async getProduct(productId: string): Promise<Product | null> {
    try {
      const query = `
        query GetProduct($id: ID!) {
          product(id: $id) {
            id
            title
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  availableForSale
                  quantityAvailable
                  selectedOptions { name value }
                }
              }
            }
          }
        }
      `;

      const response = await shopifyClient.request(query, {
        variables: { id: productId }
      });

      if (!response.data?.product) {
        return null;
      }

      return this.transformShopifyProduct(response.data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  static async getProductsByCollection(handleOrId?: string): Promise<Product[]> {
    try {
      console.log('[ShopifyProductService] getProductsByCollection called with:', handleOrId);

      const usingId = !!handleOrId && handleOrId.startsWith('gid://shopify/Collection/');

      const queryById = `
        query GetProductsByCollectionId($first: Int!, $collectionId: ID!) {
          collection(id: $collectionId) {
            id
            title
            handle
            products(first: $first) {
              edges {
                node {
                  id
                  title
                  description
                  handle
                  publishedAt
                  availableForSale
                  images(first: 1) { 
                    edges { 
                      node { 
                        url 
                        altText 
                      } 
                    } 
                  }
                  variants(first: 100) { 
                    edges { 
                      node { 
                        id 
                        title 
                        price { 
                          amount 
                          currencyCode 
                        } 
                        compareAtPrice { 
                          amount 
                          currencyCode 
                        } 
                        availableForSale 
                        quantityAvailable 
                        selectedOptions { 
                          name 
                          value 
                        }
                      } 
                    } 
                  }
                  priceRange { 
                    minVariantPrice { 
                      amount 
                      currencyCode 
                    } 
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `;

      const queryByHandle = `
        query GetProductsByCollectionHandle($first: Int!, $handle: String!) {
          collectionByHandle(handle: $handle) {
            id
            title
            handle
            products(first: $first) {
              edges {
                node {
                  id
                  title
                  description
                  handle
                  publishedAt
                  availableForSale
                  images(first: 1) { 
                    edges { 
                      node { 
                        url 
                        altText 
                      } 
                    } 
                  }
                  variants(first: 100) { 
                    edges { 
                      node { 
                        id 
                        title 
                        price { 
                          amount 
                          currencyCode 
                        } 
                        compareAtPrice { 
                          amount 
                          currencyCode 
                        } 
                        availableForSale 
                        quantityAvailable 
                        selectedOptions { 
                          name 
                          value 
                        }
                      } 
                    } 
                  }
                  priceRange { 
                    minVariantPrice { 
                      amount 
                      currencyCode 
                    } 
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `;

      const variables: any = { first: 250 }; // Increased from 20 to 250 (Shopify's max)
      let response: any;

      if (!handleOrId) {
        // Fallback to all products if no identifier provided
        const allProductsQuery = `
          query GetAllProducts($first: Int!) {
            products(first: $first) {
              edges { 
                node { 
                  id 
                  title 
                  description 
                  handle 
                  publishedAt 
                  availableForSale 
                  images(first: 1) { 
                    edges { 
                      node { 
                        url 
                        altText 
                      } 
                    } 
                  } 
                  variants(first: 100) { 
                    edges { 
                      node { 
                        id 
                        title 
                        price { 
                          amount 
                          currencyCode 
                        } 
                        compareAtPrice { 
                          amount 
                          currencyCode 
                        } 
                        availableForSale 
                        quantityAvailable 
                        selectedOptions { 
                          name 
                          value 
                        }
                      } 
                    } 
                  } 
                  priceRange { 
                    minVariantPrice { 
                      amount 
                      currencyCode 
                    } 
                  } 
                } 
              }
            }
          }
        `;
        response = await shopifyClient.request(allProductsQuery, { variables });
        console.log('[ShopifyProductService] GraphQL response (all products):', response);
        const products = response.data?.products?.edges || [];
        const transformed = products.map((edge: any) => this.transformShopifyProduct(edge.node));
        console.log(`[ShopifyProductService] Returning ${transformed.length} transformed products`);
        return transformed;
      }

      if (usingId) {
        variables.collectionId = handleOrId;
        console.log('[ShopifyProductService] Using collection ID:', handleOrId);
        response = await shopifyClient.request(queryById, { variables });
      } else {
        variables.handle = handleOrId;
        console.log('[ShopifyProductService] Using collection handle:', handleOrId);
        response = await shopifyClient.request(queryByHandle, { variables });
      }

      console.log('[ShopifyProductService] GraphQL response received:', response);
      if ((response as any)?.errors) {
        try {
          const errs = (response as any).errors;
          console.error('[ShopifyProductService] GraphQL errors:', errs);
          const messages = Array.isArray(errs) ? errs.map((e: any) => e.message).join(' | ') : String(errs);
          console.error('[ShopifyProductService] GraphQL error messages:', messages);
        } catch (e) {
          console.error('[ShopifyProductService] Failed to parse GraphQL errors');
        }
      }

      let productEdges: any[] = [];
      if (usingId) {
        productEdges = response.data?.collection?.products?.edges || [];
      } else {
        productEdges = response.data?.collectionByHandle?.products?.edges || [];
      }

      if (productEdges.length === 0) {
        console.log('[ShopifyProductService] No products found in response');
      }

      // Debug: log how many variants Shopify returned for each product
      try {
        productEdges.forEach((edge: any, idx: number) => {
          const node = edge?.node || {};
          const vEdges = node?.variants?.edges || [];
          const vTitles = vEdges.map((e: any) => e?.node?.title).filter(Boolean).slice(0, 20);
          // eslint-disable-next-line no-console
          console.log(`[ShopifyProductService] Product ${idx + 1}:`, node?.title, '| variants:', vEdges.length, vTitles);
        });
      } catch {}

      const transformedProducts = productEdges.map((edge: any) => this.transformShopifyProduct(edge.node));
      console.log(`[ShopifyProductService] Returning ${transformedProducts.length} transformed products`);
      return transformedProducts;
    } catch (error) {
      console.error('Error fetching products by collection:', error);
      return [];
    }
  }

  static async getCollections(): Promise<any[]> {
    try {
      console.log('[ShopifyProductService] getCollections called');
      const query = `
        query GetCollections {
          collections(first: 10) {
            edges {
              node {
                id
                title
                description
                handle
                image {
                  url
                  altText
                }
              }
            }
          }
        }
      `;

      console.log('[ShopifyProductService] Making collections request...');
      const response = await shopifyClient.request(query);
      console.log('[ShopifyProductService] Collections response:', response);

      if (!response.data?.collections?.edges) {
        console.log('[ShopifyProductService] No collections found in response');
        return [];
      }

      const collections = response.data.collections.edges.map((edge: any) => edge.node);
      console.log(`[ShopifyProductService] Returning ${collections.length} collections`);
      console.log('Collections found:', collections.map(c => ({ id: c.id, title: c.title, handle: c.handle })));
      return collections;
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }

  private static transformShopifyProduct(shopifyProduct: ShopifyProduct): Product {
    const basePrice = parseFloat(shopifyProduct.priceRange.minVariantPrice.amount);
    const imageUrl = shopifyProduct.images.edges[0]?.node.url || '';

    // Map variants with absolute pricing (and compare-at if present)
    const variantEdges = shopifyProduct.variants?.edges || [];
    try {
      const debugVariantTitles = variantEdges.map((e: any) => e?.node?.title).filter(Boolean);
      // eslint-disable-next-line no-console
      console.log('[transformShopifyProduct] Product:', shopifyProduct.title, 'variants:', variantEdges.length, debugVariantTitles);
    } catch {}
    
    // Group variants by their options to handle variant combinations
    const variants = [];
    const variantMap = new Map();
    
    variantEdges.forEach((edge: any) => {
      const variant = edge.node;
      const variantName = variant.selectedOptions
        .map((opt: any) => opt.value)
        .join(' / ');
      
      variants.push({
        id: variant.id,
        name: 'Variant',
        value: variantName || variant.title,
        priceAmount: parseFloat(variant.price?.amount ?? basePrice),
        compareAtPriceAmount: variant.compareAtPrice?.amount 
          ? parseFloat(variant.compareAtPrice.amount) 
          : undefined,
        available: variant.availableForSale,
        quantityAvailable: variant.quantityAvailable
      });
    });
    
    // If no variants were added, add a default one
    if (variants.length === 0) {
      variants.push({
        id: shopifyProduct.id,
        name: 'Default',
        value: 'Default',
        priceAmount: basePrice,
        compareAtPriceAmount: undefined,
        available: true,
        quantityAvailable: 1
      });
    }

    return {
      id: shopifyProduct.id,
      name: shopifyProduct.title,
      description: shopifyProduct.description,
      basePrice,
      image: imageUrl,
      variants
    };
  }

  static async getCollectionByHandle(handle: string): Promise<any | null> {
    try {
      console.log('[ShopifyProductService] Fetching collection by handle:', handle);
      const query = `
        query GetCollectionByHandle($handle: String!) {
          collectionByHandle(handle: $handle) {
            id
            title
            description
          }
        }
      `;

      const response = await shopifyClient.request(query, {
        variables: { handle }
      });
      console.log('[ShopifyProductService] getCollectionByHandle response:', response);
      return response.data?.collectionByHandle || null;
    } catch (error) {
      console.error('Error fetching collection by handle:', handle, error);
      return null;
    }
  }

  static async getFirstVariantIdFromCollectionHandle(handle: string): Promise<string | null> {
    try {
      console.log('[ShopifyProductService] Fetching first variant from collection handle:', handle);
      const query = `
        query GetFirstVariantFromCollection($handle: String!) {
          collectionByHandle(handle: $handle) {
            products(first: 10) {
              edges {
                node {
                  variants(first: 10) {
                    edges {
                      node {
                        id
                        availableForSale
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await shopifyClient.request(query, {
        variables: { handle }
      });
      console.log('[ShopifyProductService] getFirstVariantIdFromCollectionHandle response:', response);

      const products = response.data?.collectionByHandle?.products?.edges || [];
      for (const edge of products) {
        const variants = edge?.node?.variants?.edges || [];
        // Prefer the first available variant
        const available = variants.find((v: any) => v?.node?.availableForSale);
        if (available?.node?.id) return available.node.id;
        if (variants[0]?.node?.id) return variants[0].node.id;
      }

      return null;
    } catch (error) {
      console.error('Error fetching first variant from collection handle:', handle, error);
      return null;
    }
  }

  static async testSpecificProduct(productId: string): Promise<any> {
    try {
      console.log('[ShopifyProductService] Testing specific product:', productId);
      const query = `
      query GetProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          description
          publishedAt
          availableForSale
          collections(first: 10) {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    `;

      const response = await shopifyClient.request(query, {
        variables: { id: `gid://shopify/Product/${productId}` }
      });

      try {
        const vEdges = response?.data?.product?.variants?.edges || [];
        const vCount = vEdges.length;
        const vTitles = vEdges.map((e: any) => e?.node?.title).filter(Boolean);
        // eslint-disable-next-line no-console
        console.log('[ShopifyProductService] testSpecificProduct variants:', vCount, vTitles);
      } catch {}

      console.log('[ShopifyProductService] Specific product response:', response);
      return response.data?.product || null;
    } catch (error) {
      console.error('Error fetching specific product:', productId, error);
      return null;
    }
  }

  static async createCart(productVariantId: string, quantity: number = 1): Promise<string | null> {
    try {
      console.log('Creating cart with productVariantId:', productVariantId, 'quantity:', quantity);

      const query = `
        mutation CreateCart($input: CartInput!) {
          cartCreate(input: $input) {
            cart {
              id
              checkoutUrl
            }
            userErrors {
              code
              message
              field
            }
          }
        }
      `;

      const variables = {
        input: {
          lines: [
            {
              quantity,
              merchandiseId: productVariantId
            }
          ]
        }
      };

      console.log('Cart creation variables:', variables);

      const response = await shopifyClient.request(query, { variables });
      console.log('Cart creation response:', response);
      console.log('Full response data:', response.data);

      if (response.data?.cartCreate?.cart) {
        console.log('Cart created successfully:', response.data.cartCreate.cart.id);
        return response.data.cartCreate.cart.id;
      }

      // Check for user errors in the response
      const userErrors = response.data?.cartCreate?.userErrors;
      console.log('Raw user errors from response:', userErrors);

      if (userErrors && Array.isArray(userErrors) && userErrors.length > 0) {
        console.error('Cart creation user errors:', userErrors);
        // Show detailed error messages
        userErrors.forEach((error: any, index: number) => {
          console.error(`User Error ${index + 1}:`, {
            code: error.code,
            message: error.message,
            field: error.field,
            ...error
          });
        });

        // Also show errors in alert for immediate visibility
        alert(`Cart creation failed: ${userErrors.map((e: any) => e.message).join(', ')}`);

        return null;
      }

      console.error('Cart creation failed but no specific errors found in response');
      console.error('Full response structure:', JSON.stringify(response, null, 2));

      alert('Cart creation failed: Unknown error - check console for details');
      return null;
    } catch (error: any) {
      console.error('Error creating cart:', error);

      // Enhanced error logging
      if (error.message) {
        console.error('Error message:', error.message);
      }
      if (error.response) {
        console.error('Error response:', error.response);
        console.error('Error response data:', error.response.data);
      }
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        console.error('GraphQL errors:', error.graphQLErrors);
        // Show GraphQL errors to user
        const errorMessages = error.graphQLErrors.map((e: any) => e.message).join(', ');
        alert(`Cart creation failed: ${errorMessages}`);
      }
      if (error.networkError) {
        console.error('Network error:', error.networkError);
        alert('Cart creation failed: Network error - check your connection');
      }

      alert(`Cart creation failed: ${error.message || 'Network error'}`);
      return null;
    }
  }

  static async addToCart(cartId: string, productVariantId: string, quantity: number = 1): Promise<boolean> {
    try {
      console.log('Adding to cart - cartId:', cartId, 'productVariantId:', productVariantId, 'quantity:', quantity);

      const query = `
        mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
          cartLinesAdd(cartId: $cartId, lines: $lines) {
            cart {
              id
            }
            userErrors {
              code
              message
              field
            }
          }
        }
      `;

      const variables = {
        cartId,
        lines: [
          {
            quantity,
            merchandiseId: productVariantId
          }
        ]
      };

      console.log('Add to cart variables:', variables);

      const response = await shopifyClient.request(query, { variables });
      console.log('Add to cart response:', response);

      if (response.data?.cartLinesAdd?.cart) {
        console.log('Product added to cart successfully');
        return true;
      }

      // Enhanced error handling
      const userErrors = response.data?.cartLinesAdd?.userErrors;
      if (userErrors && userErrors.length > 0) {
        console.error('Add to cart user errors:', userErrors);
        userErrors.forEach((error: any, index: number) => {
          console.error(`User Error ${index + 1}:`, error.code, error.message);
        });
        alert(`Failed to add to cart: ${userErrors.map((e: any) => e.message).join(', ')}`);
      } else {
        console.error('Add to cart failed but no specific errors returned');
        alert('Failed to add product to cart. Please try again.');
      }

      return false;
    } catch (error: any) {
      console.error('Error adding to cart:', error);

      // Enhanced error logging
      if (error.message) {
        console.error('Error message:', error.message);
      }
      if (error.response) {
        console.error('Error response:', error.response);
      }
      if (error.graphQLErrors) {
        console.error('GraphQL errors:', error.graphQLErrors);
      }

      return false;
    }
  }

  static async updateCartItem(cartId: string, lineId: string, quantity: number): Promise<boolean> {
    try {
      const query = `
        mutation UpdateCartItem($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
          cartLinesUpdate(cartId: $cartId, lines: $lines) {
            cart {
              id
            }
            userErrors {
              code
              message
              field
            }
          }
        }
      `;

      const variables = {
        cartId,
        lines: [
          {
            id: lineId,
            quantity
          }
        ]
      };

      const response = await shopifyClient.request(query, { variables });

      if (response.data?.cartLinesUpdate?.cart) {
        return true;
      }

      const userErrors = response.data?.cartLinesUpdate?.userErrors;
      if (userErrors && userErrors.length > 0) {
        console.error('Update cart user errors:', userErrors);
        userErrors.forEach((error: any, index: number) => {
          console.error(`User Error ${index + 1}:`, error.code, error.message);
        });
        alert(`Failed to update cart: ${userErrors.map((e: any) => e.message).join(', ')}`);
      } else {
        console.error('Update cart failed but no specific errors returned');
        alert('Failed to update cart item. Please try again.');
      }

      return false;
    } catch (error) {
      console.error('Error updating cart item:', error);
      return false;
    }
  }

  static async removeFromCart(cartId: string, lineId: string): Promise<boolean> {
    try {
      const query = `
        mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
          cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
            cart {
              id
            }
            userErrors {
              code
              message
              field
            }
          }
        }
      `;

      const variables = {
        cartId,
        lineIds: [lineId]
      };

      const response = await shopifyClient.request(query, { variables });

      if (response.data?.cartLinesRemove?.cart) {
        return true;
      }

      const userErrors = response.data?.cartLinesRemove?.userErrors;
      if (userErrors && userErrors.length > 0) {
        console.error('Remove from cart user errors:', userErrors);
        userErrors.forEach((error: any, index: number) => {
          console.error(`User Error ${index + 1}:`, error.code, error.message);
        });
        alert(`Failed to remove from cart: ${userErrors.map((e: any) => e.message).join(', ')}`);
      } else {
        console.error('Remove from cart failed but no specific errors returned');
        alert('Failed to remove item from cart. Please try again.');
      }

      return false;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  }

  static async getCart(cartId: string): Promise<any> {
    try {
      const query = `
        query GetCart($id: ID!) {
          cart(id: $id) {
            id
            checkoutUrl
            lines(first: 10) {
              edges {
                node {
                  id
                  quantity
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                      product {
                        title
                        images(first: 1) {
                          edges {
                            node {
                              url
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            cost {
              subtotalAmount {
                amount
                currencyCode
              }
              totalAmount {
                amount
                currencyCode
              }
              totalTaxAmount {
                amount
                currencyCode
              }
            }
          }
        }
      `;

      const response = await shopifyClient.request(query, {
        variables: { id: cartId }
      });

      return response.data?.cart || null;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return null;
    }
  }
}
