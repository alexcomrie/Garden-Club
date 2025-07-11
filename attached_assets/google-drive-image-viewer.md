"use client";

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ImageOff } from 'lucide-react';

interface GoogleDriveImageViewerProps {
  imageUrls: string[];
}

/**
 * Converts a Google Drive file URL to a direct image link that can be used in an <img> tag.
 * It handles URLs with '/view?usp=drive_link' and '/view?usp=sharing'.
 * @param url The Google Drive URL.
 * @returns A direct image URL or an empty string if the URL is invalid.
 */
function convertGoogleDriveUrl(url: string): string {
    if (!url || !url.includes('drive.google.com')) {
        return url; 
    }
    const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (match && match[1]) {
        const fileId = match[1];
        return `https://drive.google.com/uc?id=${fileId}`;
    }
    return '';
}

export function GoogleDriveImageViewer({ imageUrls }: GoogleDriveImageViewerProps) {
  const validImageLinks = imageUrls
    .map(convertGoogleDriveUrl)
    .filter(url => url); // Filter out any empty strings from invalid conversions

  return (
    <div className="mt-8">
        <h2 className="text-2xl font-bold font-headline tracking-tight text-primary sm:text-3xl lg:text-4xl mb-4">
            Direct Google Drive Images
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pt-4">
        {validImageLinks.map((src, index) => (
            <Card key={`gdrive-${index}-${src}`} className="overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105">
            <CardContent className="p-0">
                <div className="aspect-square relative bg-muted/50">
                <Image
                    src={src}
                    alt={`Google Drive image ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                    data-ai-hint="gallery photo"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const errorDiv = parent.querySelector('.error-placeholder');
                        if (errorDiv) {
                            (errorDiv as HTMLElement).style.display = 'flex';
                        }
                      }
                    }}
                />
                <div className="error-placeholder hidden absolute inset-0 items-center justify-center flex-col text-destructive bg-muted">
                    <ImageOff className="h-8 w-8" />
                    <p className="text-xs mt-2 text-center px-1">Image failed to load</p>
                </div>
                </div>
            </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
}
