/**
 * Product Gallery Component
 *
 * This component displays a product image gallery with a main image and thumbnail navigation.
 * It supports:
 * - Main image display
 * - Thumbnail navigation (horizontal scroll on mobile)
 * - Click to change main image
 * - Fallback when no images are available
 */
import { ImageIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "~/core/lib/utils";

interface ProductImage {
  image_id: number;
  image_url: string;
  image_order: number;
}

interface ProductGalleryProps {
  images: ProductImage[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Handle empty images case
  if (!images || images.length === 0) {
    return (
      <div className="from-muted to-muted/50 flex aspect-square w-full items-center justify-center rounded-lg bg-gradient-to-br">
        <ImageIcon className="text-muted-foreground/50 h-16 w-16" />
      </div>
    );
  }

  const selectedImage = images[selectedImageIndex];

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {selectedImage && (
          <img
            src={selectedImage.image_url}
            alt={`상품 이미지 ${selectedImageIndex + 1}`}
            className="h-full w-full object-cover"
            loading="eager"
          />
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
          {images.map((image, index) => (
            <button
              key={image.image_id}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              className={cn(
                "relative flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
                selectedImageIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
              aria-label={`이미지 ${index + 1} 선택`}
            >
              <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                <img
                  src={image.image_url}
                  alt={`썸네일 ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

