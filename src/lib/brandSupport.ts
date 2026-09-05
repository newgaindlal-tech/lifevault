export interface BrandSupportInfo {
  brandName: string;
  officialSupportUrl: string;
  tollFreeNumber?: string;
  whatsappNumber?: string;
  serviceCenterLocatorUrl?: string;
}

// Curated verified official portals (No scraping, pure public domain)
const BRAND_REGISTRY: Record<string, BrandSupportInfo> = {
  samsung: {
    brandName: 'Samsung',
    officialSupportUrl: 'https://www.samsung.com/in/support/',
    tollFreeNumber: '1800 5 7267864',
    whatsappNumber: '180057267864',
    serviceCenterLocatorUrl: 'https://www.samsung.com/in/support/service-center/',
  },
  apple: {
    brandName: 'Apple',
    officialSupportUrl: 'https://support.apple.com/en-in',
    tollFreeNumber: '000800 100 9009',
    serviceCenterLocatorUrl: 'https://locate.apple.com/in/en/',
  },
  lg: {
    brandName: 'LG Electronics',
    officialSupportUrl: 'https://www.lg.com/in/support',
    tollFreeNumber: '1800 315 9999',
    whatsappNumber: '9711709999',
    serviceCenterLocatorUrl: 'https://www.lg.com/in/support/locate-service-center',
  },
  sony: {
    brandName: 'Sony',
    officialSupportUrl: 'https://www.sony.co.in/electronics/support',
    tollFreeNumber: '1800 103 7799',
    serviceCenterLocatorUrl: 'https://locator.sony/en_IN/servicecenters/',
  },
  hp: {
    brandName: 'HP',
    officialSupportUrl: 'https://support.hp.com/in-en',
    tollFreeNumber: '1800 258 7170',
    whatsappNumber: '912261014560',
    serviceCenterLocatorUrl: 'https://support.hp.com/in-en/service-center',
  },
  dell: {
    brandName: 'Dell',
    officialSupportUrl: 'https://www.dell.com/support/home/en-in',
    tollFreeNumber: '1800 425 4002',
    serviceCenterLocatorUrl: 'https://www.dell.com/support/home/en-in/service-center',
  },
  lenovo: {
    brandName: 'Lenovo',
    officialSupportUrl: 'https://pcsupport.lenovo.com/in/en/',
    tollFreeNumber: '1800 419 7555',
    serviceCenterLocatorUrl: 'https://support.lenovo.com/in/en/serviceprovider',
  },
  xiaomi: {
    brandName: 'Xiaomi / Redmi',
    officialSupportUrl: 'https://www.mi.com/in/service/online/',
    tollFreeNumber: '1800 103 6286',
    serviceCenterLocatorUrl: 'https://www.mi.com/in/service/repair/',
  },
  whirlpool: {
    brandName: 'Whirlpool',
    officialSupportUrl: 'https://www.whirlpoolindia.com/customer-care',
    tollFreeNumber: '1800 208 1800',
    whatsappNumber: '9667427788',
    serviceCenterLocatorUrl: 'https://www.whirlpoolindia.com/service-locator',
  },
  bajaj: {
    brandName: 'Bajaj Electricals',
    officialSupportUrl: 'https://www.shop.bajajelectricals.com/customer-support',
    tollFreeNumber: '022 4128 0000',
    serviceCenterLocatorUrl: 'https://www.shop.bajajelectricals.com/locate-service-center',
  },
  maruti: {
    brandName: 'Maruti Suzuki',
    officialSupportUrl: 'https://www.marutisuzuki.com/service-and-maintenance',
    tollFreeNumber: '1800 102 1800',
    serviceCenterLocatorUrl: 'https://www.marutisuzuki.com/dealer-locator',
  },
  tata: {
    brandName: 'Tata Motors',
    officialSupportUrl: 'https://cars.tatamotors.com/service.html',
    tollFreeNumber: '1800 209 8282',
    serviceCenterLocatorUrl: 'https://cars.tatamotors.com/service-locator.html',
  },
};

/**
 * Resolves official support details by brand name.
 * Uses exact or substring matching.
 */
export function resolveBrandSupport(
  brandName?: string | null,
  productName?: string | null,
  customSupportUrl?: string | null
): {
  hasKnownSupport: boolean;
  supportInfo?: BrandSupportInfo;
  customUrl?: string;
  searchFallbackUrl: string;
} {
  const customUrl = customSupportUrl && customSupportUrl.trim() ? customSupportUrl.trim() : undefined;

  // Build target query for fallback
  const cleanBrand = (brandName || '').trim();
  const cleanProduct = (productName || '').trim();
  const querySubject = cleanBrand || cleanProduct || 'electronics customer care';
  const searchFallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${querySubject} official customer care service center support`
  )}`;

  if (!cleanBrand) {
    return {
      hasKnownSupport: false,
      customUrl,
      searchFallbackUrl,
    };
  }

  const normalized = cleanBrand.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Look for exact or partial key match in official registry
  for (const [key, info] of Object.entries(BRAND_REGISTRY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        hasKnownSupport: true,
        supportInfo: info,
        customUrl,
        searchFallbackUrl,
      };
    }
  }

  return {
    hasKnownSupport: false,
    customUrl,
    searchFallbackUrl,
  };
}