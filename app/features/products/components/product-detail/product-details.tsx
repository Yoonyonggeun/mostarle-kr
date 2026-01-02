/**
 * Product Details Component
 *
 * This component displays product detail sections in a professional and elegant layout.
 * Features alternating grid layouts for text and images with subtle interactions.
 */
interface ProductDetail {
  detail_id: number;
  detail_title: string;
  detail_description: string;
  detail_image_url: string | null;
  detail_order: number;
}

interface ProductDetailsProps {
  details: ProductDetail[];
}

export function ProductDetails({ details }: ProductDetailsProps) {
  if (!details || details.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border/50 pt-16">
      {/* Section Header */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
          상품 상세 정보
        </h2>
        <div className="mt-3 h-1 w-16 bg-primary/20" />
      </div>

      {/* Detail Sections */}
      <div className="flex flex-col gap-24">
        {details.map((detail, index) => {
          const isEven = index % 2 === 0;
          const hasImage = !!detail.detail_image_url;

          return (
            <section
              key={detail.detail_id}
              className="group relative"
            >
              {hasImage ? (
                // Grid Layout for sections with images
                <div
                  className={`grid gap-8 lg:grid-cols-2 lg:gap-12 ${
                    !isEven ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  {/* Text Content */}
                  <div
                    className={`flex flex-col justify-center ${
                      !isEven ? "lg:col-start-2" : ""
                    }`}
                  >
                    <h3 className="mb-6 text-2xl font-bold tracking-tight lg:text-3xl">
                      {detail.detail_title}
                    </h3>
                    <div className="space-y-4 text-base leading-7 text-muted-foreground lg:text-lg">
                      {detail.detail_description
                        .split("\n")
                        .filter((line) => line.trim())
                        .map((paragraph, pIndex) => (
                          <p
                            key={pIndex}
                            className="whitespace-pre-line"
                          >
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  </div>

                  {/* Image Content */}
                  <div
                    className={`relative overflow-hidden rounded-2xl bg-muted/30 ${
                      !isEven ? "lg:col-start-1 lg:row-start-1" : ""
                    }`}
                  >
                    <div className="aspect-[4/3] w-full">
                      <img
                        src={detail.detail_image_url!}
                        alt={detail.detail_title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                    {/* Subtle gradient overlay on hover */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                </div>
              ) : (
                // Text-only Layout
                <div className="mx-auto max-w-3xl">
                  <h3 className="mb-6 text-2xl font-bold tracking-tight lg:text-3xl">
                    {detail.detail_title}
                  </h3>
                  <div className="space-y-4 text-base leading-7 text-muted-foreground lg:text-lg">
                    {detail.detail_description
                      .split("\n")
                      .filter((line) => line.trim())
                      .map((paragraph, pIndex) => (
                        <p
                          key={pIndex}
                          className="whitespace-pre-line"
                        >
                          {paragraph}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              {/* Section Divider (except for last item) */}
              {index < details.length - 1 && (
                <div className="mt-16 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

