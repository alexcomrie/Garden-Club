/**
 * Image Proxy Server
 * 
 * This server-side endpoint proxies image requests to avoid CORS issues
 * when loading images from Google Drive and other external sources.
 */

import express from 'express';
// @ts-ignore - Ignore missing type declarations for node-fetch
import fetch from 'node-fetch';
// @ts-ignore - Ignore missing type declarations for cors
import cors from 'cors';

const router = express.Router();

// Enable CORS for all routes in this router
router.use(cors());

/**
 * GET /api/image-proxy
 * 
 * Proxies an image request to avoid CORS issues
 * 
 * Query parameters:
 * - url: The URL of the image to proxy (required, must be URL encoded)
 */
router.get('/', async (req, res) => {
  const imageUrl = req.query.url as string;
  
  if (!imageUrl) {
    return res.status(400).send('Missing image URL');
  }
  
  try {
    // Decode the URL (it should be encoded in the client)
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // Fetch the image
    console.log(`[ImageProxy] Attempting to fetch: ${decodedUrl}`);
    const response = await fetch(decodedUrl);
    
    console.log(`[ImageProxy] Response from Google Drive for ${decodedUrl}: Status ${response.status}`);
    response.headers.forEach((value, name) => {
      console.log(`[ImageProxy] Google Response Header for ${decodedUrl}: ${name}: ${value}`);
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[ImageProxy] Failed to fetch image ${decodedUrl}. Status: ${response.status} ${response.statusText}. Body: ${errorBody.substring(0, 200)}`);
      return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Get the content type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      console.log(`[ImageProxy] Setting Content-Type for ${decodedUrl}: ${contentType}`);
      res.setHeader('Content-Type', contentType);
    } else {
      console.warn(`[ImageProxy] No content-type header from Google Drive for ${decodedUrl}`);
    }
    
    // Stream the response to the client
    response.body.pipe(res);
  } catch (error: any) {
    console.error(`[ImageProxy] Error proxying image ${req.query.url}:`, error.message, error.stack);
    res.status(500).send(`Error proxying image: ${error.message}`);
  }
});

export default router;