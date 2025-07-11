import { useEffect, useState } from 'react';
import { BusinessService } from '@/services/business-service';
import { ImageProxyService } from '@/services/image-proxy-service';
import { Dialog } from '@/components/ui/dialog';

interface ImageViewerProps {
  imageUrl: string;
  alt?: string;
  className?: string;
  onError?: () => void;
  refreshKey?: number;
  enableZoom?: boolean;
}

export default function ImageViewer({ 
  imageUrl, 
  alt = '', 
  className = '', 
  onError, 
  refreshKey = 0,
  enableZoom = false 
}: ImageViewerProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imageSrc, setImageSrc] = useState<string>('');
  const [fallbackAttempt, setFallbackAttempt] = useState(0);

  // Process the image URL and set up fallback mechanisms
  useEffect(() => {
    setError(false);
    setLoading(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setFallbackAttempt(0);
    
    if (imageUrl) {
      // Start with the proxied URL
      const proxiedUrl = `${ImageProxyService.getProxiedGoogleDriveUrl(imageUrl)}&t=${refreshKey}`;
      console.log('[ImageViewer] Initial attempt with proxied URL:', proxiedUrl);
      setImageSrc(proxiedUrl);
    }
  }, [imageUrl, refreshKey]);

  if (!imageUrl) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <img
          src="/images/placeholder.svg"
          alt="Placeholder"
          className="w-24 h-24 opacity-50"
        />
      </div>
    );
  }

  const handleError = () => {
    const fileId = extractGoogleDriveFileId(imageUrl);
    console.log(`[ImageViewer] Handling error for ${imageUrl}. Fallback attempt: ${fallbackAttempt}, File ID: ${fileId}`);

    // Try fallback methods if the image fails to load
    if (fallbackAttempt === 0) {
      // First fallback: Try Google Drive thumbnail URL (often more reliable for direct embedding)
      setFallbackAttempt(1);
      if (fileId) {
        const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000&t=${refreshKey}`;
        console.log('[ImageViewer] Trying fallback 1 (Thumbnail):', thumbnailUrl);
        setImageSrc(thumbnailUrl);
      } else {
        console.log('[ImageViewer] Fallback 1 skipped: No File ID for thumbnail.');
        // If no file ID, try next fallback directly or error out if it was essential
        setError(true); // Or proceed to next if applicable
        setLoading(false);
        onError?.();
      }
    } else if (fallbackAttempt === 1) {
      // Second fallback: Try direct (unproxied) Google Drive view URL
      setFallbackAttempt(2);
      const directViewUrl = `${BusinessService.getDirectImageUrl(imageUrl)}&t=${refreshKey}`; // BusinessService.getDirectImageUrl already adds a timestamp
      console.log('[ImageViewer] Trying fallback 2 (Direct View):', directViewUrl);
      setImageSrc(directViewUrl);
    } else {
      // All fallbacks failed
      console.log('[ImageViewer] All fallbacks failed for:', imageUrl);
      setError(true);
      setLoading(false);
      onError?.();
    }
  };
  
  // Helper function to extract Google Drive file ID
  const extractGoogleDriveFileId = (url: string): string | null => {
    if (!url) return null;
    let fileId = null;

    // Regular expression to capture file IDs from various Google Drive URL formats
    // Covers:
    // - /file/d/FILE_ID/...
    // - /d/FILE_ID/...
    // - open?id=FILE_ID
    // - uc?id=FILE_ID... (already a direct link component, but good to catch ID)
    const regexes = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)/
    ];

    for (const regex of regexes) {
      const match = url.match(regex);
      if (match && match[1]) {
        fileId = match[1];
        break;
      }
    }
    // console.log(`[ImageViewer] Extracted File ID '${fileId}' from URL '${url}'`);
    return fileId;
  };

  const handleLoad = () => {
    setLoading(false);
  };

  const handleZoom = (event: WheelEvent) => {
    if (!enableZoom) return;
    event.preventDefault();
    const delta = event.deltaY * -0.01;
    const newScale = Math.min(Math.max(scale + delta, 0.5), 4);
    setScale(newScale);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!enableZoom || scale === 1) return;
    if (event.buttons === 1) {
      setPosition({
        x: position.x + event.movementX,
        y: position.y + event.movementY
      });
    }
  };

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <img
          src="/images/placeholder.svg"
          alt="Placeholder"
          className="w-24 h-24 opacity-50"
        />
      </div>
    );
  }

  const imageComponent = (
    <div 
      className={`relative ${className} ${enableZoom ? 'cursor-move' : ''}`}
      onWheel={handleZoom as any}
      onMouseMove={handleMouseMove}
      style={{ overflow: 'hidden' }}
    >
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          transition: loading ? 'opacity 0.3s' : 'transform 0.1s'
        }}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
      {loading && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      {enableZoom && (
        <button
          onClick={handleFullscreenToggle}
          className="absolute bottom-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V9a1 1 0 01-2 0V4zm12 0a1 1 0 00-1-1h-4a1 1 0 000 2h2.586l-2.293 2.293a1 1 0 001.414 1.414L15 6.414V9a1 1 0 002 0V4zM4 16a1 1 0 001 1h4a1 1 0 000-2H6.414l2.293-2.293a1 1 0 00-1.414-1.414L5 13.586V11a1 1 0 00-2 0v5zm12 0a1 1 0 01-1 1h-4a1 1 0 010-2h2.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V11a1 1 0 012 0v5z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5.414l2.293 2.293a1 1 0 11-1.414 1.414L4 6.414V9a1 1 0 01-2 0V4zm12 0a1 1 0 00-1-1h-4a1 1 0 000 2h2.586l-2.293 2.293a1 1 0 001.414 1.414L16 6.414V9a1 1 0 002 0V4zM3 16a1 1 0 001 1h4a1 1 0 000-2H5.414l2.293-2.293a1 1 0 00-1.414-1.414L4 13.586V11a1 1 0 00-2 0v5zm12 0a1 1 0 01-1 1h-4a1 1 0 010-2h2.586l-2.293-2.293a1 1 0 011.414-1.414L16 13.586V11a1 1 0 012 0v5z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      )}
    </div>
  );

  return (
    <>
      {imageComponent}
      {isFullscreen && (
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            {imageComponent}
          </div>
        </Dialog>
      )}
    </>
  );
}