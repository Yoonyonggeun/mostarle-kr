/**
 * Banner Form Component
 *
 * This component provides a form for creating and editing banners.
 * It handles image upload, validation, and form submission.
 */
import type { Route } from "@rr/app/features/banners/api/+types/create";

import { ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import FormErrors from "~/core/components/form-error";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Checkbox } from "~/core/components/ui/checkbox";
import { cn } from "~/core/lib/utils";

interface Banner {
  banner_id: number;
  image_url_mobile: string;
  image_url_desktop: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface BannerFormProps {
  initialData?: Banner;
  actionUrl?: string;
  mode?: "create" | "edit";
}

export default function BannerForm({
  initialData,
  actionUrl = "/api/banners/create",
  mode = "create",
}: BannerFormProps = {}) {
  const fetcher = useFetcher<Route.ComponentProps["actionData"]>();
  const formRef = useRef<HTMLFormElement>(null);

  // Form state
  const [linkUrl, setLinkUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [mobileImagePreview, setMobileImagePreview] = useState<string | null>(null);
  const [desktopImageFile, setDesktopImageFile] = useState<File | null>(null);
  const [desktopImagePreview, setDesktopImagePreview] = useState<string | null>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const desktopFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setLinkUrl(initialData.link_url || "");
      setDisplayOrder(initialData.display_order.toString());
      setIsActive(initialData.is_active);
      setMobileImagePreview(initialData.image_url_mobile);
      setDesktopImagePreview(initialData.image_url_desktop);
    }
  }, [initialData]);

  // Handle mobile image file selection
  const handleMobileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMobileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMobileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle desktop image file selection
  const handleDesktopImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesktopImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDesktopImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    if (linkUrl) {
      formData.append("link_url", linkUrl);
    }
    if (displayOrder) {
      formData.append("display_order", displayOrder);
    }
    formData.append("is_active", isActive ? "on" : "off");

    // Append mobile image if it's a new file
    if (mobileImageFile) {
      formData.append("image_mobile", mobileImageFile);
    } else if (mode === "create") {
      // In create mode, mobile image is required
      return;
    }

    // Append desktop image if it's a new file
    if (desktopImageFile) {
      formData.append("image_desktop", desktopImageFile);
    } else if (mode === "create") {
      // In create mode, desktop image is required
      return;
    }

    // Add banner_id for edit mode
    if (mode === "edit" && initialData) {
      formData.append("banner_id", initialData.banner_id.toString());
    }

    fetcher.submit(formData, {
      method: "POST",
      action: actionUrl,
      encType: "multipart/form-data",
    });
  };

  // Reset form on success
  useEffect(() => {
    if (fetcher.data?.success && mode === "create") {
      formRef.current?.reset();
      setLinkUrl("");
      setDisplayOrder("");
      setIsActive(true);
      setMobileImageFile(null);
      setMobileImagePreview(null);
      setDesktopImageFile(null);
      setDesktopImagePreview(null);
      if (mobileFileInputRef.current) {
        mobileFileInputRef.current.value = "";
      }
      if (desktopFileInputRef.current) {
        desktopFileInputRef.current.value = "";
      }
    }
  }, [fetcher.data, mode]);

  const isLoading = fetcher.state === "submitting";

  return (
    <Card className="w-full max-w-screen-xl">
      <form ref={formRef} onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          {fetcher.data?.error && (
            <FormErrors errors={[fetcher.data.error]} />
          )}

          {/* Mobile Image */}
          <div className="space-y-2">
            <Label htmlFor="image_mobile">
              모바일 이미지 {mode === "create" && <span className="text-destructive">*</span>}
            </Label>
            <div className="space-y-4">
              {mobileImagePreview && (
                <div className="relative w-full overflow-hidden rounded-md border">
                  <img
                    src={mobileImagePreview}
                    alt="Mobile Preview"
                    className="h-64 w-full object-contain"
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <Input
                  ref={mobileFileInputRef}
                  id="image_mobile"
                  type="file"
                  accept="image/*"
                  onChange={handleMobileImageChange}
                  disabled={isLoading}
                  required={mode === "create"}
                />
                {mobileImagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMobileImageFile(null);
                      setMobileImagePreview(null);
                      if (mobileFileInputRef.current) {
                        mobileFileInputRef.current.value = "";
                      }
                    }}
                    disabled={isLoading}
                  >
                    이미지 제거
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {mode === "create"
                  ? "모바일용 배너 이미지를 업로드하세요. (최대 5MB)"
                  : "새로운 모바일 이미지를 업로드하면 기존 이미지가 교체됩니다. (최대 5MB)"}
              </p>
            </div>
          </div>

          {/* Desktop Image */}
          <div className="space-y-2">
            <Label htmlFor="image_desktop">
              PC 이미지 {mode === "create" && <span className="text-destructive">*</span>}
            </Label>
            <div className="space-y-4">
              {desktopImagePreview && (
                <div className="relative w-full overflow-hidden rounded-md border">
                  <img
                    src={desktopImagePreview}
                    alt="Desktop Preview"
                    className="h-64 w-full object-contain"
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <Input
                  ref={desktopFileInputRef}
                  id="image_desktop"
                  type="file"
                  accept="image/*"
                  onChange={handleDesktopImageChange}
                  disabled={isLoading}
                  required={mode === "create"}
                />
                {desktopImagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDesktopImageFile(null);
                      setDesktopImagePreview(null);
                      if (desktopFileInputRef.current) {
                        desktopFileInputRef.current.value = "";
                      }
                    }}
                    disabled={isLoading}
                  >
                    이미지 제거
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {mode === "create"
                  ? "PC용 배너 이미지를 업로드하세요. (최대 5MB)"
                  : "새로운 PC 이미지를 업로드하면 기존 이미지가 교체됩니다. (최대 5MB)"}
              </p>
            </div>
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <Label htmlFor="link_url">링크 URL</Label>
            <Input
              id="link_url"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-sm">
              배너 클릭 시 이동할 URL을 입력하세요. (선택사항)
            </p>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="display_order">표시 순서</Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="자동 설정"
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-sm">
              배너의 표시 순서를 설정합니다. 비워두면 자동으로 설정됩니다.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
              disabled={isLoading}
            />
            <Label
              htmlFor="is_active"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              활성화
            </Label>
          </div>
        </CardContent>
        <CardFooter className="pt-6">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading
              ? mode === "create"
                ? "생성 중..."
                : "수정 중..."
              : mode === "create"
                ? "배너 생성하기"
                : "배너 수정하기"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

