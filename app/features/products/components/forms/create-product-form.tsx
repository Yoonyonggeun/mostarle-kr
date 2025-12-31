import { type Route } from "@rr/app/features/products/api/+types/create";
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
}

export default function CreateProductForm() {
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

  // Drag and drop state
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [draggedDetailId, setDraggedDetailId] = useState<string | null>(null);

  // Auto-generate slug when title changes
  useEffect(() => {
    if (autoGenerateSlug && title) {
      setSlug(generateSlug(title));
    }
  }, [title, autoGenerateSlug]);

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
    if (detail?.imagePreview) {
      URL.revokeObjectURL(detail.imagePreview);
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
          d.id === id
            ? { ...d, image: file, imagePreview: preview }
            : d,
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
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }
    setImages(images.filter((img) => img.id !== id));
  };

  // Drag and drop handlers for images
  const handleImageDragStart = (id: string) => {
    setDraggedImageId(id);
  };

  const handleImageDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedImageId && draggedImageId !== id) {
      const draggedIndex = images.findIndex((img) => img.id === draggedImageId);
      const targetIndex = images.findIndex((img) => img.id === id);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newImages = [...images];
        const [removed] = newImages.splice(draggedIndex, 1);
        newImages.splice(targetIndex, 0, removed);
        setImages(newImages);
        setDraggedImageId(id);
      }
    }
  };

  const handleImageDragEnd = () => {
    setDraggedImageId(null);
  };

  // Drag and drop handlers for details
  const handleDetailDragStart = (id: string) => {
    setDraggedDetailId(id);
  };

  const handleDetailDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedDetailId && draggedDetailId !== id) {
      const draggedIndex = details.findIndex((d) => d.id === draggedDetailId);
      const targetIndex = details.findIndex((d) => d.id === id);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newDetails = [...details];
        const [removed] = newDetails.splice(draggedIndex, 1);
        newDetails.splice(targetIndex, 0, removed);
        setDetails(newDetails);
        setDraggedDetailId(id);
      }
    }
  };

  const handleDetailDragEnd = () => {
    setDraggedDetailId(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (images.length === 0) {
      return;
    }

    const formData = new FormData();
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

    // Add images
    images.forEach((img) => {
      formData.append("images", img.file);
    });

    // Add details
    details.forEach((detail, index) => {
      formData.append(`details[${index}].title`, detail.title);
      formData.append(`details[${index}].description`, detail.description);
      if (detail.image) {
        formData.append(`details[${index}].image`, detail.image);
      }
    });

    fetcher.submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
      action: "/api/products/create",
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
                URL에 사용되는 고유 식별자입니다. 비워두면 제목에서 자동 생성됩니다.
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
            <CardDescription>상품의 크기를 입력하세요 (mm 단위)</CardDescription>
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
                    onDragEnd={handleImageDragEnd}
                    className={cn(
                      "group relative cursor-move rounded-lg border-2 border-dashed p-2 transition-colors",
                      draggedImageId === img.id && "border-primary opacity-50",
                    )}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-md">
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <GripVertical className="text-white size-8" />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 size-6"
                      onClick={() => handleRemoveImage(img.id)}
                    >
                      <XIcon className="size-4" />
                    </Button>
                    <div className="mt-2 text-center text-xs text-muted-foreground">
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
                onDragEnd={handleDetailDragEnd}
                className={cn(
                  "relative border-2 transition-colors",
                  draggedDetailId === detail.id && "border-primary opacity-50",
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
              label="상품 생성"
              className="w-full"
              disabled={images.length === 0}
            />
            {fetcher.data &&
            "success" in fetcher.data &&
            fetcher.data.success ? (
              <FormSuccess message="상품이 성공적으로 생성되었습니다" />
            ) : null}
            {fetcher.data && "error" in fetcher.data && fetcher.data.error ? (
              <FormErrors errors={[fetcher.data.error]} />
            ) : null}
            {fetcher.data &&
            "fieldErrors" in fetcher.data &&
            Object.keys(fetcher.data.fieldErrors || {}).length > 0 ? (
              <FormErrors
                errors={[
                  "입력한 정보를 확인하고 다시 시도해주세요",
                ]}
              />
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </fetcher.Form>
  );
}

