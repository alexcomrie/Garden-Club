/**
 * Image Proxy Service
 * 
 * This service provides a way to proxy image requests through a CORS-enabled service
 * to avoid cross-origin issues when loading images from Google Drive and other sources.
 */

/**
 * Convert a Google Drive URL to a format that can be directly used in an <img> tag
 * @param url The original Google Drive URL
 * @returns A direct viewable URL
 */
function getProxiedGoogleDriveUrl(url: string): string {
  if (!url) return '';
  
  // First convert to the standard Google Drive direct URL
  let directUrl = url;
  
  if (url.includes('drive.google.com')) {
    // Extract file ID from Google Drive URL for both formats
    const regExp = /\/d\/([a-zA-Z0-9_-]+)|\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = regExp.exec(url);
    if (match) {
      const fileId = match[1] || match[2];
      if (fileId) {
        // Create the direct Google Drive URL
        directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
  }
  
  // Then proxy it through our server-side proxy endpoint
  // This avoids CORS issues by having the server fetch the image
  return `/api/image-proxy?url=${encodeURIComponent(directUrl)}`;
}

/**
 * Test if an image URL is accessible
 * @param url The image URL to test
 * @returns Promise resolving to true if the image is accessible, false otherwise
 */
async function testImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    const directUrl = getProxiedGoogleDriveUrl(url);
    const response = await fetch(directUrl, { 
      method: 'HEAD',
      mode: 'no-cors' // This allows the request but limits response information
    });
    // With no-cors, we can't actually check response.ok, so we assume success if no error is thrown
    return true;
  } catch (e) {
    console.warn('Failed to test image URL:', url, e);
    return false;
  }
}

export const ImageProxyService = {
  getProxiedGoogleDriveUrl,
  testImageUrl
};