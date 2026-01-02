/**
 * Banner Carousel Component
 *
 * This component displays a carousel of active banners with automatic and manual navigation.
 * It supports responsive images, pagination indicators, and link navigation.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";
import { cn } from "~/core/lib/utils";

interface Banner {
  banner_id: number;
  image_url_mobile: string;
  image_url_desktop: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface BannerCarouselProps {
  banners: Banner[];
}

const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Disable carousel if there's only one or no banners
  const shouldShowCarousel = banners.length > 1;

  // Auto-slide effect
  useEffect(() => {
    if (!shouldShowCarousel || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [banners.length, shouldShowCarousel, isPaused]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  // If no banners, don't render anything
  if (banners.length === 0) {
    return null;
  }

  // If only one banner, render without carousel controls
  if (!shouldShowCarousel) {
    const banner = banners[0];
    const BannerContent = (
      <div className="relative w-full overflow-hidden">
        <picture>
          <source
            media="(min-width: 768px)"
            srcSet={banner.image_url_desktop}
          />
          <img
            src={banner.image_url_mobile}
            alt="Banner"
            className="h-auto w-full object-cover"
            style={{ aspectRatio: "16/9" }}
            loading="eager"
          />
        </picture>
      </div>
    );

    if (banner.link_url) {
      return (
        <Link
          to={banner.link_url}
          className="block"
          aria-label="배너 링크"
        >
          {BannerContent}
        </Link>
      );
    }

    return BannerContent;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="배너 캐러셀"
    >
      {/* Banner Image */}
      <div className="relative w-full overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {banners.map((banner, index) => {
            const BannerImage = (
              <div
                key={banner.banner_id}
                className="relative w-full flex-shrink-0"
              >
                <picture>
                  <source
                    media="(min-width: 768px)"
                    srcSet={banner.image_url_desktop}
                  />
                  <img
                    src={banner.image_url_mobile}
                    alt={`배너 ${index + 1}`}
                    className="h-auto w-full object-cover md:aspect-[21/9]"
                    style={{ aspectRatio: "16/9" }}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </picture>
              </div>
            );

            if (banner.link_url) {
              return (
                <Link
                  key={banner.banner_id}
                  to={banner.link_url}
                  className="block w-full flex-shrink-0"
                  aria-label={`배너 ${index + 1} 링크`}
                >
                  {BannerImage}
                </Link>
              );
            }

            return BannerImage;
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 md:left-4"
        onClick={goToPrevious}
        aria-label="이전 배너"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 md:right-4"
        onClick={goToNext}
        aria-label="다음 배너"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Pagination Indicators */}
      <div
        className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2"
        role="tablist"
        aria-label="배너 인디케이터"
      >
        {banners.map((banner, index) => (
          <button
            key={banner.banner_id}
            type="button"
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`배너 ${index + 1}로 이동`}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "w-8 bg-white"
                : "w-2 bg-white/50 hover:bg-white/75",
            )}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      {/* Current Position Indicator */}
      <div
        className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white"
        aria-live="polite"
        aria-atomic="true"
      >
        {currentIndex + 1}/{banners.length}
      </div>
    </div>
  );
}

