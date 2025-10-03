/**
 * Test fixtures and mock data for E2E tests
 */

export const SPOTIFY_TEST_DATA = {
  mockCode: 'test_auth_code_12345',
  mockState: 'test_state_67890',
  mockAccessToken: 'mock_spotify_access_token',
  mockRefreshToken: 'mock_spotify_refresh_token',
  mockSessionId: 'mock_session_12345',
  artistId: '4dpARuHxo51G3z768sgnrY', // Example Spotify artist ID
  trackUri: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp',
  albumUri: 'spotify:album:2ODvWsOgouMbaA5xf0RkJe',
};

export const APPLE_MUSIC_TEST_DATA = {
  mockToken: 'mock_apple_developer_token',
  songUrl: 'https://music.apple.com/us/song/test-song/123456',
  albumUrl: 'https://music.apple.com/us/album/test-album/789012',
  songUrlWithParams: 'https://music.apple.com/us/song/test-song/123456?i=789&at=1000l3K&ct=campaign',
};

export const MEDUSA_TEST_DATA = {
  cart: {
    id: 'cart_test_12345',
    region_id: 'reg_test',
    currency_code: 'usd',
  },
  product: {
    id: 'prod_test_12345',
    title: 'Test Product',
    handle: 'test-product',
    variants: [
      {
        id: 'variant_test_12345',
        title: 'Default',
        prices: [
          {
            amount: 2999,
            currency_code: 'usd',
          }
        ]
      }
    ]
  },
  shippingAddress: {
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    address_1: '123 Test St',
    city: 'Test City',
    postal_code: '12345',
    country_code: 'US',
  },
  shippingOption: {
    id: 'so_test_12345',
    name: 'Standard Shipping',
    amount: 500,
    price_type: 'flat_rate',
  },
};

export const TEST_URLS = {
  home: '/',
  checkout: '/checkout',
  success: '/success',
  adminLogin: '/admin/login',
  adminProducts: '/admin/products',
  adminProductNew: '/admin/products/new',
};

export const SELECTORS = {
  // Spotify
  spotifyConnect: '[data-testid="spotify-connect"]',
  spotifyEmbed: '.spotify-embed-wrapper',
  spotifySaveButton: '.action-btn.save-btn',
  spotifyFollowButton: '.action-btn.follow-btn',

  // Apple Music
  appleMusicEmbed: '.apple-music-embed-container',
  appleMusicAddButton: '.action-btn.add-library-btn',
  appleMusicAuthorizeButton: '.action-btn.login-btn',

  // Checkout
  addToCartButton: '.btn-add-to-cart, [data-testid="add-to-cart"]',
  checkoutButton: '.btn-checkout, [data-testid="checkout-button"]',
  emailInput: '#email',
  firstNameInput: '#first_name',
  lastNameInput: '#last_name',
  addressInput: '#address_1',
  cityInput: '#city',
  postalCodeInput: '#postal_code',
  saveAddressButton: 'button:has-text("Save address")',
  loadShippingOptionsButton: 'button:has-text("Load options")',
  completeOrderButton: 'button:has-text("Pay (Medusa provider)")',

  // Generic
  loadingSpinner: '.loading-spinner',
  alert: '.alert',
  alertError: '.alert--error, .alert-error',
  alertSuccess: '.alert--success, .alert-success',
};

export const MOCK_RESPONSES = {
  spotifyToken: {
    access_token: SPOTIFY_TEST_DATA.mockAccessToken,
    refresh_token: SPOTIFY_TEST_DATA.mockRefreshToken,
    expires_in: 3600,
    token_type: 'Bearer',
  },

  appleToken: {
    token: APPLE_MUSIC_TEST_DATA.mockToken,
    cached: false,
    exp: Math.floor(Date.now() / 1000) + 43200, // 12 hours
  },

  medusaCart: {
    cart: {
      id: MEDUSA_TEST_DATA.cart.id,
      region_id: MEDUSA_TEST_DATA.cart.region_id,
      currency_code: MEDUSA_TEST_DATA.cart.currency_code,
      items: [],
      shipping_address: null,
      shipping_methods: [],
      payment_sessions: [],
      subtotal: 0,
      total: 0,
      tax_total: 0,
      shipping_total: 0,
    }
  },

  medusaShippingOptions: {
    shipping_options: [MEDUSA_TEST_DATA.shippingOption]
  },
};
