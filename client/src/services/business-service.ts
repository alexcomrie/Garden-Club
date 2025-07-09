import { Business, Product } from "@shared/schema";

// Add hashCode extension for string to match Dart functionality
declare global {
  interface String {
    hashCode: number;
  }
}

Object.defineProperty(String.prototype, 'hashCode', {
  get: function() {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
      const char = this.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
});

// Exact URL from the CSV file
const PROFILE_SHEET_URL = 
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsstw4tcDryjFRgMtk7dWyB5WSKE9fu02YOLb5PnajOBGrq9W1wwvHxjvMrxzank8xsHUKBkRF0ib9/pub?output=csv';

let businessCache: Business[] = [];
let productCache: Map<string, Map<string, Product[]>> = new Map();

async function testDirectImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    const directUrl = getDirectImageUrl(url);
    const response = await fetch(directUrl, { method: 'HEAD' });
    return response.ok;
  } catch (e) {
    console.warn('Failed to test image URL:', url, e);
    return false;
  }
}


function productFromCsv(row: string[]): Product {
  return {
    name: row[0] || '',
    category: row[1] || 'Other',
    price: parseFloat(row[2]) || 0,
    description: row[3] || '',
    imageUrl: row[4] ? getDirectImageUrl(row[4]) : '',
    inStock: row[5]?.toLowerCase() === 'in stock'
  };
}

function parseProductsCSV(csvText: string): Map<string, Product[]> {
  // Remove BOM if present
  csvText = csvText.replace(/^\uFEFF/, '');
  const rows = parseCSV(csvText);
  const products = new Map<string, Product[]>();
  
  // Skip header row (index 0) and process all data rows
  for (let i = 1; i < rows.length; i++) {
    try {
      const row = rows[i];
      if (row.length >= 6) { // Minimum required columns
        const product = productFromCsv(row);
        
        if (!products.has(product.category)) {
          products.set(product.category, []);
        }
        products.get(product.category)!.push(product);
      }
    } catch (e) {
      console.warn('Failed to parse product row:', rows[i], e);
    }
  }
  
  return products;
}

async function loadBusinessesFromLocal(): Promise<Business[]> {
  try {
    const cached = localStorage.getItem('businesses');
    if (cached) {
      const businesses = JSON.parse(cached) as Business[];
      return businesses.filter(business => business.status.toLowerCase() === 'active');
    }
  } catch (e) {
    console.warn('Error loading from localStorage:', e);
  }
  return [];
}

async function saveBusinessesToLocal(businesses: Business[]): Promise<void> {
  try {
    localStorage.setItem('businesses', JSON.stringify(businesses));
  } catch (e) {
    console.warn('Error saving to localStorage:', e);
  }
}

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const char = csvText[i];

    if (char === '"') {
      if (inQuotes && i + 1 < csvText.length && csvText[i + 1] === '"') {
        // Escaped quote
        currentField += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
      i++;
    } else if ((char === '\r' && i + 1 < csvText.length && csvText[i + 1] === '\n') || char === '\n') {
      if (!inQuotes) {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0) {
          rows.push([...currentRow]);
          currentRow = [];
        }
        currentField = '';
        i += (char === '\r' ? 2 : 1);
      } else {
        currentField += char === '\r' ? '\r\n' : '\n';
        i += (char === '\r' ? 2 : 1);
      }
    } else {
      currentField += char;
      i++;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows;
}

function businessFromCsv(row: string[]): Business {
  return {
    id: row[0].toLowerCase().replace(/\s+/g, '_'),
    name: row[0] || '',
    ownerName: row[1] || '',
    address: row[2] || '',
    phoneNumber: row[3] || '',
    whatsAppNumber: row[4] || '',
    emailAddress: row[5] || '',
    hasDelivery: (row[6] || '').toLowerCase() === 'yes',
    deliveryArea: row[7] || '',
    operationHours: row[8] || '',
    specialHours: row[9] || '',
    profilePictureUrl: row[10] || '',
    productSheetUrl: row[11] || '',
    status: (row[12] || '').toLowerCase(),
    bio: row[13] || '',
    mapLocation: row.length > 14 ? row[14] || '' : '',
    deliveryCost: row.length > 15 ? parseFloat(row[15]) || null : null,
    islandWideDelivery: row.length > 16 ? row[16] || '' : '',
    islandWideDeliveryCost: row.length > 17 ? parseFloat(row[17]) || null : null
  };
}

function parseBusinessesCSV(csvText: string): Business[] {
  // Remove BOM if present
  csvText = csvText.replace(/^\uFEFF/, '');
  const rows = parseCSV(csvText);
  const businesses: Business[] = [];
  
  // Skip header row (index 0) and process all data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    if (row.length >= 14) { // Minimum required columns
      try {
        const business = businessFromCsv(row);
        
        // Match Dart implementation's filtering criteria
        const isActive = business.status.toLowerCase() === 'active' &&
                        business.profilePictureUrl.length > 0 &&
                        business.name.length > 0;
        
        if (isActive) {
          businesses.push(business);
        }
      } catch (e) {
        console.warn('Failed to parse business row:', row, e);
      }
    }
  }
  
  return businesses;
}

async function fetchBusinessesFromNetwork(): Promise<Business[]> {
  try {
    console.log('Fetching businesses from:', PROFILE_SHEET_URL);
    const response = await fetch(PROFILE_SHEET_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv, text/plain, */*',
      }
    });
    
    if (!response.ok) {
      console.error('Fetch response not ok:', response.status, response.statusText);
      throw new Error(`Failed to load businesses: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log('CSV Response length:', csvText.length);
    console.log('CSV Response preview:', csvText.substring(0, 500));
    
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Empty response from server');
    }
    
    const businesses = parseBusinessesCSV(csvText);
    console.log('Parsed businesses count:', businesses.length);
    businesses.forEach((business, index) => {
      console.log(`Business ${index + 1}:`, business.name, 'Status:', business.status, 'Profile URL:', business.profilePictureUrl);
    });
    
    if (businesses.length === 0) {
      throw new Error('No valid businesses found in CSV data');
    }
    
    await saveBusinessesToLocal(businesses);
    businessCache = businesses;
    return businesses;
  } catch (e) {
    console.error('Error fetching businesses:', e);
    throw e;
  }
}

async function loadBusinesses(): Promise<Business[]> {
  try {
    if (businessCache && businessCache.length > 0) {
      return businessCache;
    }

    const businesses = await loadBusinessesFromLocal();
    if (businesses.length > 0) {
      businessCache = businesses;
      return businesses;
    }
  } catch (e) {
    console.warn('Failed to load businesses from local storage:', e);
  }

  try {
    return await fetchBusinessesFromNetwork();
  } catch (e) {
    console.error('Failed to fetch businesses from network:', e);
    throw e;
  }
}

async function loadProductsFromLocal(productSheetUrl: string): Promise<Map<string, Product[]>> {
  try {
    const cacheKey = `products_${btoa(productSheetUrl)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const productsObj = JSON.parse(cached);
      const products = new Map<string, Product[]>();
      Object.entries(productsObj).forEach(([category, items]) => {
        products.set(category, items as Product[]);
      });
      return products;
    }
  } catch (e) {
    console.warn('Error loading products from localStorage:', e);
  }
  return new Map();
}

async function saveProductsToLocal(productSheetUrl: string, products: Map<string, Product[]>): Promise<void> {
  try {
    const cacheKey = `products_${btoa(productSheetUrl)}`;
    const productsObj = Object.fromEntries(products);
    localStorage.setItem(cacheKey, JSON.stringify(productsObj));
    localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
  } catch (e) {
    console.warn('Error saving products to localStorage:', e);
  }
}

async function fetchProductsFromNetwork(productSheetUrl: string): Promise<Map<string, Product[]>> {
  try {
    const response = await fetch(productSheetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv, text/plain, */*',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load products: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Empty response from server');
    }
    
    const products = parseProductsCSV(csvText);
    await saveProductsToLocal(productSheetUrl, products);
    productCache.set(productSheetUrl, products);
    return products;
  } catch (e) {
    console.error('Error fetching products:', e);
    throw e;
  }
}

async function loadProducts(productSheetUrl: string): Promise<Map<string, Product[]>> {
  if (!productSheetUrl || productSheetUrl.trim() === '') {
    throw new Error('Product sheet URL is required');
  }

  if (productCache.has(productSheetUrl)) {
    return productCache.get(productSheetUrl)!;
  }

  try {
    const products = await loadProductsFromLocal(productSheetUrl);
    if (products.size > 0) {
      productCache.set(productSheetUrl, products);
      return products;
    }
  } catch (e) {
    console.warn('Failed to load products from local storage:', e);
  }

  try {
    return await fetchProductsFromNetwork(productSheetUrl);
  } catch (e) {
    console.error('Failed to fetch products from network:', e);
    throw e;
  }
}

function getDirectImageUrl(url: string): string {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    // Extract file ID from Google Drive URL for both formats
    const regExp = /\/d\/([a-zA-Z0-9_-]+)|\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = regExp.exec(url);
    if (match) {
      const fileId = match[1] || match[2];
      if (fileId) {
        // Use export=view instead of export=download for better compatibility
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
  }
  return url;
}

export const BusinessService = {
  loadBusinesses,
  fetchBusinessesFromNetwork,
  loadProducts,
  getDirectImageUrl,
  testDirectImageUrl
};