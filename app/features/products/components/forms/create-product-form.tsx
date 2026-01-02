import type { Route } from "@rr/app/features/products/api/+types/create";

import {
  GripVertical,
  ImageIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import FetcherFormButton from "~/core/components/fetcher-form-button";
import FormErrors from "~/core/components/form-error";
import FormSuccess from "~/core/components/form-success";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Separator } from "~/core/components/ui/separator";
import { Textarea } from "~/core/components/ui/textarea";
import { cn } from "~/core/lib/utils";

/**
 * Generate a URL-safe slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface DetailItem {
  id: string;
  title: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
}

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  existingId?: number; // For existing images from database
  existingUrl?: string; // For existing images from database
}

interface ExistingImage {
  image_id: number;
  image_url: string;
  image_order: number;
}

interface ExistingDetail {
  detail_id: number;
  detail_title: string;
  detail_description: string;
  detail_image_url: string | null;
  detail_order: number;
}

interface InitialData {
  product: {
    product_id: number;
    title: string;
    price: number;
    difficulty: number | null;
    working_time: number;
    width: number | null;
    height: number | null;
    depth: number | null;
    slug: string;
    sold_out: boolean;
  };
  images: ExistingImage[];
  details: ExistingDetail[];
}

interface CreateProductFormProps {
  initialData?: InitialData;
  actionUrl?: string;
  mode?: "create" | "edit";
}

export default function CreateProductForm({
  initialData,
  actionUrl = "/api/products/create",
  mode = "create",
}: CreateProductFormProps = {}) {
  const fetcher = useFetcher<Route.ComponentProps["actionData"]>();
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [workingTime, setWorkingTime] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [depth, setDepth] = useState("");
  const [slug, setSlug] = useState("");
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);

  // Dynamic fields
  const [details, setDetails] = useState<DetailItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<number[]>([]);
  const [existingDetailIds, setExistingDetailIds] = useState<number[]>([]);

  // Drag and drop state
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [draggedDetailId, setDraggedDetailId] = useState<string | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);
  const [dragOverDetailId, setDragOverDetailId] = useState<string | null>(null);

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.product.title);
      setPrice(initialData.product.price.toString());
      setDifficulty(initialData.product.difficulty?.toString() || "");
      setWorkingTime(initialData.product.working_time.toString());
      setWidth(initialData.product.width?.toString() || "");
      setHeight(initialData.product.height?.toString() || "");
      setDepth(initialData.product.depth?.toString() || "");
      setSlug(initialData.product.slug);
      setAutoGenerateSlug(false);

      // Set existing images
      const existingImages: ImageItem[] = initialData.images
        .sort((a, b) => a.image_order - b.image_order)
        .map((img) => ({
          id: `existing-${img.image_id}`,
          file: new File([], ""), // Dummy file for existing images
          preview: img.image_url,
          existingId: img.image_id,
          existingUrl: img.image_url,
        }));
      setImages(existingImages);
      setExistingImageIds(initialData.images.map((img) => img.image_id));

      // Set existing details
      const existingDetails: DetailItem[] = initialData.details
        .sort((a, b) => a.detail_order - b.detail_order)
        .map((detail) => ({
          id: `existing-${detail.detail_id}`,
          title: detail.detail_title,
          description: detail.detail_description,
          image: null,
          imagePreview: detail.detail_image_url || null,
        }));
      setDetails(existingDetails);
      setExistingDetailIds(
        initialData.details.map((detail) => detail.detail_id),
      );
    }
  }, [initialData]);

  // Auto-generate slug when title changes (only in create mode)
  useEffect(() => {
    if (mode === "create" && autoGenerateSlug && title) {
      setSlug(generateSlug(title));
    }
  }, [title, autoGenerateSlug, mode]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
      details.forEach((detail) => {
        if (detail.imagePreview) {
          URL.revokeObjectURL(detail.imagePreview);
        }
      });
    };
  }, []);

  // Reset form on success
  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      formRef.current?.reset();
      setTitle("");
      setPrice("");
      setDifficulty("");
      setWorkingTime("");
      setWidth("");
      setHeight("");
      setDepth("");
      setSlug("");
      setDetails([]);
      setImages([]);
      // Clean up preview URLs
      images.forEach((img) => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
      details.forEach((detail) => {
        if (detail.imagePreview) {
          URL.revokeObjectURL(detail.imagePreview);
        }
      });
    }
  }, [fetcher.data]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setAutoGenerateSlug(false);
  };

  const handleSlugFocus = () => {
    setAutoGenerateSlug(false);
  };

  const handleAddDetail = () => {
    const newDetail: DetailItem = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      image: null,
      imagePreview: null,
    };
    setDetails([...details, newDetail]);
  };

  const handleRemoveDetail = (id: string) => {
    const detail = details.find((d) => d.id === id);
    if (detail?.imagePreview && detail.id.startsWith("existing-")) {
      // Only revoke if it's a new preview, not an existing URL
      try {
        URL.revokeObjectURL(detail.imagePreview);
      } catch {
        // Ignore errors for existing URLs
      }
    }
    // Remove from existing IDs if it was an existing detail
    if (detail?.id.startsWith("existing-")) {
      const detailId = parseInt(detail.id.replace("existing-", ""), 10);
      if (!isNaN(detailId)) {
        setExistingDetailIds(
          existingDetailIds.filter((dId) => dId !== detailId),
        );
      }
    }
    setDetails(details.filter((d) => d.id !== id));
  };

  const handleDetailChange = (
    id: string,
    field: "title" | "description",
    value: string,
  ) => {
    setDetails(
      details.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  const handleDetailImageChange = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const detail = details.find((d) => d.id === id);
      if (detail?.imagePreview) {
        URL.revokeObjectURL(detail.imagePreview);
      }
      const preview = URL.createObjectURL(file);
      setDetails(
        details.map((d) =>
          d.id === id ? { ...d, image: file, imagePreview: preview } : d,
        ),
      );
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: ImageItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages([...images, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    const image = images.find((img) => img.id === id);
    if (image?.preview && !image.existingUrl) {
      // Only revoke if it's not an existing image URL
      URL.revokeObjectURL(image.preview);
    }
    // Remove from existing IDs if it was an existing image
    if (image?.existingId) {
      setExistingImageIds(
        existingImageIds.filter((imgId) => imgId !== image.existingId),
      );
    }
    setImages(images.filter((img) => img.id !== id));
  };

  // Drag and drop handlers for images
  const handleImageDragStart = (id: string) => {
    setDraggedImageId(id);
  };

  const handleImageDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedImageId && draggedImageId !== id) {
      setDragOverImageId(id);
    }
  };

  const handleImageDragLeave = () => {
    setDragOverImageId(null);
  };

  const handleImageDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedImageId && draggedImageId !== targetId) {
      const draggedIndex = images.findIndex((img) => img.id === draggedImageId);
      const targetIndex = images.findIndex((img) => img.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newImages = [...images];
        const [removed] = newImages.splice(draggedIndex, 1);
        newImages.splice(targetIndex, 0, removed);
        setImages(newImages);
      }
    }

    setDraggedImageId(null);
    setDragOverImageId(null);
  };

  const handleImageDragEnd = () => {
    setDraggedImageId(null);
    setDragOverImageId(null);
  };

  // Drag and drop handlers for details
  const handleDetailDragStart = (id: string) => {
    setDraggedDetailId(id);
  };

  const handleDetailDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedDetailId && draggedDetailId !== id) {
      setDragOverDetailId(id);
    }
  };

  const handleDetailDragLeave = () => {
    setDragOverDetailId(null);
  };

  const handleDetailDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedDetailId && draggedDetailId !== targetId) {
      const draggedIndex = details.findIndex((d) => d.id === draggedDetailId);
      const targetIndex = details.findIndex((d) => d.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newDetails = [...details];
        const [removed] = newDetails.splice(draggedIndex, 1);
        newDetails.splice(targetIndex, 0, removed);
        setDetails(newDetails);
      }
    }

    setDraggedDetailId(null);
    setDragOverDetailId(null);
  };

  const handleDetailDragEnd = () => {
    setDraggedDetailId(null);
    setDragOverDetailId(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // In edit mode, allow submission if there are existing images or new images
    // In create mode, require at least one image
    if (mode === "create" && images.length === 0) {
      return;
    }
    if (
      mode === "edit" &&
      images.length === 0 &&
      existingImageIds.length === 0
    ) {
      return;
    }

    const formData = new FormData();

    // Add product_id in edit mode
    if (mode === "edit" && initialData) {
      formData.append("product_id", initialData.product.product_id.toString());
    }

    formData.append("title", title);
    formData.append("price", price);
    if (difficulty) {
      formData.append("difficulty", difficulty);
    }
    formData.append("working_time", workingTime);
    if (width) {
      formData.append("width", width);
    }
    if (height) {
      formData.append("height", height);
    }
    if (depth) {
      formData.append("depth", depth);
    }
    if (slug) {
      formData.append("slug", slug);
    }

    // Add existing image IDs in the current order (for edit mode)
    // This preserves the order after drag and drop
    if (mode === "edit") {
      images.forEach((img) => {
        if (img.existingId) {
          formData.append("existing_image_ids", img.existingId.toString());
        }
      });
    }

    // Add new images (only files, not existing ones) in the current order
    images.forEach((img) => {
      if (img.file && img.file.size > 0 && !img.existingId) {
        formData.append("images", img.file);
      }
    });

    // Add existing detail IDs in the current order (for edit mode)
    // This preserves the order after drag and drop
    if (mode === "edit") {
      details.forEach((detail) => {
        if (detail.id.startsWith("existing-")) {
          const detailId = parseInt(detail.id.replace("existing-", ""), 10);
          if (!isNaN(detailId)) {
            formData.append("existing_detail_ids", detailId.toString());
          }
        }
      });
    }

    // Add details in the current order (preserves drag and drop order)
    details.forEach((detail, index) => {
      formData.append(`details[${index}].title`, detail.title);
      formData.append(`details[${index}].description`, detail.description);
      // 기존 detail의 detail_id 전송 (edit 모드에서)
      if (mode === "edit" && detail.id.startsWith("existing-")) {
        const detailId = parseInt(detail.id.replace("existing-", ""), 10);
        if (!isNaN(detailId)) {
          formData.append(`details[${index}].detail_id`, detailId.toString());
        }
      }
      // Add image if it's a new file (including when replacing existing detail image)
      if (detail.image) {
        formData.append(`details[${index}].image`, detail.image);
      }
    });

    fetcher.submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
      action: actionUrl,
    });
  };

  return (
    <fetcher.Form
      ref={formRef}
      onSubmit={handleSubmit}
      className="w-full max-w-screen-md"
      encType="multipart/form-data"
    >
      <div className="flex w-full flex-col gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>상품의 기본 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                ref={titleInputRef}
                required
                type="text"
                placeholder="예: 나무 상자 만들기"
                value={title}
                onChange={handleTitleChange}
              />
              {fetcher.data &&
              "fieldErrors" in fetcher.data &&
              fetcher.data.fieldErrors?.title ? (
                <FormErrors errors={fetcher.data.fieldErrors.title} />
              ) : null}
            </div>

            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                ref={slugInputRef}
                type="text"
                placeholder="자동 생성됨"
                value={slug}
                onChange={handleSlugChange}
                onFocus={handleSlugFocus}
              />
              <p className="text-muted-foreground text-xs">
                URL에 사용되는 고유 식별자입니다. 비워두면 제목에서 자동
                생성됩니다.
              </p>
              {fetcher.data &&
              "fieldErrors" in fetcher.data &&
              fetcher.data.fieldErrors?.slug ? (
                <FormErrors errors={fetcher.data.fieldErrors.slug} />
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-start space-y-2">
                <Label htmlFor="price">
                  가격 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {fetcher.data &&
                "fieldErrors" in fetcher.data &&
                fetcher.data.fieldErrors?.price ? (
                  <FormErrors errors={fetcher.data.fieldErrors.price} />
                ) : null}
              </div>

              <div className="flex flex-col items-start space-y-2">
                <Label htmlFor="difficulty">난이도 (1-5)</Label>
                <Input
                  id="difficulty"
                  name="difficulty"
                  type="number"
                  min="1"
                  max="5"
                  placeholder="1-5"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                />
                {fetcher.data &&
                "fieldErrors" in fetcher.data &&
                fetcher.data.fieldErrors?.difficulty ? (
                  <FormErrors errors={fetcher.data.fieldErrors.difficulty} />
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="working_time">
                작업시간 (분) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="working_time"
                name="working_time"
                required
                type="number"
                min="1"
                placeholder="60"
                value={workingTime}
                onChange={(e) => setWorkingTime(e.target.value)}
              />
              {fetcher.data &&
              "fieldErrors" in fetcher.data &&
              fetcher.data.fieldErrors?.working_time ? (
                <FormErrors errors={fetcher.data.fieldErrors.working_time} />
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Size Information */}
        <Card>
          <CardHeader>
            <CardTitle>크기 정보 (선택사항)</CardTitle>
            <CardDescription>
              상품의 크기를 입력하세요 (mm 단위)
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="width">가로 (mm)</Label>
              <Input
                id="width"
                name="width"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="height">세로 (mm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label htmlFor="depth">높이 (mm)</Label>
              <Input
                id="depth"
                name="depth"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle>
              상품 이미지 <span className="text-destructive">*</span>
            </CardTitle>
            <CardDescription>
              상품 이미지를 업로드하세요 (최소 1장, 드래그하여 순서 변경 가능)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                className="cursor-pointer"
              />
              <p className="text-muted-foreground text-xs">
                최대 5MB, PNG, JPG, GIF 형식만 가능합니다
              </p>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={() => handleImageDragStart(img.id)}
                    onDragOver={(e) => handleImageDragOver(e, img.id)}
                    onDragLeave={handleImageDragLeave}
                    onDrop={(e) => handleImageDrop(e, img.id)}
                    onDragEnd={handleImageDragEnd}
                    className={cn(
                      "group relative cursor-move rounded-lg border-2 border-dashed p-2 transition-all duration-200",
                      draggedImageId === img.id && "scale-95 opacity-50",
                      dragOverImageId === img.id &&
                        draggedImageId !== img.id &&
                        "border-primary scale-105 shadow-lg",
                      img.existingId && "border-blue-300",
                      !draggedImageId && "border-gray-300",
                    )}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-md">
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <GripVertical className="size-8 text-white" />
                      </div>
                      {img.existingId && (
                        <div className="absolute top-2 left-2 rounded bg-blue-500 px-2 py-1 text-xs text-white">
                          기존
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 size-6"
                      onClick={() => handleRemoveImage(img.id)}
                    >
                      <XIcon className="size-4" />
                    </Button>
                    <div className="text-muted-foreground mt-2 text-center text-xs">
                      순서: {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {fetcher.data &&
            "fieldErrors" in fetcher.data &&
            fetcher.data.fieldErrors?.images ? (
              <FormErrors errors={fetcher.data.fieldErrors.images} />
            ) : null}
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>상세내용 (선택사항)</CardTitle>
            <CardDescription>
              상품의 상세 정보를 추가하세요 (드래그하여 순서 변경 가능)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {details.map((detail, index) => (
              <Card
                key={detail.id}
                draggable
                onDragStart={() => handleDetailDragStart(detail.id)}
                onDragOver={(e) => handleDetailDragOver(e, detail.id)}
                onDragLeave={handleDetailDragLeave}
                onDrop={(e) => handleDetailDrop(e, detail.id)}
                onDragEnd={handleDetailDragEnd}
                className={cn(
                  "relative border-2 transition-all duration-200",
                  draggedDetailId === detail.id && "scale-95 opacity-50",
                  dragOverDetailId === detail.id &&
                    draggedDetailId !== detail.id &&
                    "border-primary scale-105 shadow-lg",
                  !draggedDetailId && "border-gray-300",
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="text-muted-foreground size-4 cursor-move" />
                      <CardTitle className="text-base">
                        상세내용 {index + 1}
                      </CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDetail(detail.id)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col items-start space-y-2">
                    <Label htmlFor={`detail-title-${detail.id}`}>
                      제목 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`detail-title-${detail.id}`}
                      type="text"
                      placeholder="상세 제목"
                      value={detail.title}
                      onChange={(e) =>
                        handleDetailChange(detail.id, "title", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col items-start space-y-2">
                    <Label htmlFor={`detail-description-${detail.id}`}>
                      설명 <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id={`detail-description-${detail.id}`}
                      placeholder="상세 설명"
                      value={detail.description}
                      onChange={(e) =>
                        handleDetailChange(
                          detail.id,
                          "description",
                          e.target.value,
                        )
                      }
                      rows={4}
                    />
                  </div>
                  <div className="flex flex-col items-start space-y-2">
                    <Label htmlFor={`detail-image-${detail.id}`}>이미지</Label>
                    <Input
                      id={`detail-image-${detail.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDetailImageChange(detail.id, e)}
                    />
                    {detail.imagePreview && (
                      <div className="relative mt-2 aspect-video w-full max-w-md overflow-hidden rounded-md border">
                        <img
                          src={detail.imagePreview}
                          alt="Detail preview"
                          className="h-full w-full object-cover"
                        />
                        {detail.id.startsWith("existing-") && (
                          <div className="absolute top-2 left-2 rounded bg-blue-500 px-2 py-1 text-xs text-white">
                            기존 이미지
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddDetail}
              className="w-full"
            >
              <PlusIcon className="size-4" />
              상세내용 추가
            </Button>
          </CardContent>
        </Card>

        {/* Submit */}
        <Card>
          <CardFooter className="flex flex-col gap-4">
            <FetcherFormButton
              submitting={fetcher.state === "submitting"}
              label={mode === "edit" ? "상품 수정" : "상품 생성"}
              className="w-full"
              disabled={
                mode === "create"
                  ? images.length === 0
                  : images.length === 0 && existingImageIds.length === 0
              }
            />
            {fetcher.data &&
            "success" in fetcher.data &&
            fetcher.data.success ? (
              <FormSuccess
                message={
                  mode === "edit"
                    ? "상품이 성공적으로 수정되었습니다"
                    : "상품이 성공적으로 생성되었습니다"
                }
              />
            ) : null}
            {fetcher.data && "error" in fetcher.data && fetcher.data.error ? (
              <FormErrors errors={[fetcher.data.error]} />
            ) : null}
            {fetcher.data &&
            "fieldErrors" in fetcher.data &&
            Object.keys(fetcher.data.fieldErrors || {}).length > 0 ? (
              <FormErrors
                errors={["입력한 정보를 확인하고 다시 시도해주세요"]}
              />
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </fetcher.Form>
  );
}
