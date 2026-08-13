"use client";

import { useState, useRef, useCallback } from "react";
import { FiUploadCloud, FiX, FiImage, FiVideo } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import UiButton from "@/components/UiButton";
import { cn } from "@/lib/utils";

const IMG_ACCEPT = "image/png,image/jpeg,image/gif,image/webp,image/svg+xml";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime";

export default function MediaUploader({
  onUploaded,
  value, // existing {url, type}
  accept = "image/*,video/*",
  maxImageMB = 8,
  maxVideoMB = 100,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // local File before upload
  const [previewUrl, setPreviewUrl] = useState(value?.url || "");
  const [previewType, setPreviewType] = useState(value?.type || "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const resetLocal = () => {
    setPreviewFile(null);
    setError("");
    setProgress(0);
  };

  const setPreviewFromFile = (file) => {
    if (!file) return;
    const type = file.type.startsWith("video/") ? "video" : "image";
    setPreviewFile(file);
    setPreviewType(type);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  };

  const handleFiles = useCallback((fileList) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("仅支持图片或视频文件");
      return;
    }
    const maxBytes = isImage ? maxImageMB * 1024 * 1024 : maxVideoMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`文件过大（最大 ${isImage ? `${maxImageMB}MB 图片` : `${maxVideoMB}MB 视频`}）`);
      return;
    }
    setPreviewFromFile(file);
  }, [maxImageMB, maxVideoMB]);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer?.files);
  };

  const doUpload = async () => {
    if (!previewFile) return;
    setError("");
    setUploading(true);
    setProgress(10);
    try {
      const fd = new FormData();
      fd.append("file", previewFile);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload", true);

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = (ev.loaded / ev.total) * 90;
          setProgress(10 + pct);
        }
      };

      const result = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          setProgress(100);
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.ok) resolve(data);
            else reject(new Error(data.error || "上传失败"));
          } catch (e) {
            reject(e);
          }
        };
        xhr.onerror = () => reject(new Error("网络错误"));
        xhr.send(fd);
      });

      setPreviewUrl(result.url);
      setPreviewType(result.type);
      setPreviewFile(null);
      onUploaded?.({ url: result.url, type: result.type, name: result.name });
    } catch (err) {
      setError(err.message || "上传失败");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const clear = () => {
    setPreviewFile(null);
    setPreviewUrl("");
    setPreviewType("");
    setError("");
    setProgress(0);
    onUploaded?.({ url: "", type: "" });
  };

  const hasPreview = !!previewUrl;
  const showUploadButton = previewFile && !uploading;

  return (
    <div className="w-full space-y-3">
      {!hasPreview ? (
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full min-h-[200px] border-[4px] border-dashed transition-all cursor-pointer select-none",
            dragActive
              ? "bg-white border-mem-red"
              : "bg-white/60 border-mem-black hover:bg-white"
          )}
        >
          <div className="flex flex-col items-center justify-center py-10 px-5 gap-3 text-center">
            <div
              className={cn(
                "w-16 h-16 flex items-center justify-center border-memphis shadow-memphis-sm",
                dragActive ? "bg-mem-red text-white" : "bg-mem-yellow text-mem-black"
              )}
            >
              <FiUploadCloud size={28} />
            </div>
            <div>
              <p className="font-display text-mem-black text-lg">
                拖拽文件到此处，或点击选择
              </p>
              <p className="mt-1 text-xs font-body text-mem-black/60">
                支持图片（PNG/JPG/WEBP/GIF，≤ {maxImageMB}MB）或视频
                （MP4/WEBM/MOV，≤ {maxVideoMB}MB）
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="flex items-center gap-1 px-2.5 py-1 bg-mem-blue text-white text-xs font-display border-memphis">
                <FiImage size={12} /> 图片
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 bg-mem-green text-mem-black text-xs font-display border-memphis">
                <FiVideo size={12} /> 视频
              </span>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : (
        <div className="relative bg-white border-memphis shadow-memphis-sm overflow-hidden">
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 z-10 w-9 h-9 bg-mem-red text-white border-memphis shadow-memphis-sm flex items-center justify-center hover:bg-white hover:text-mem-red transition-colors"
            aria-label="移除"
          >
            <FiX size={18} />
          </button>

          <div className="w-full aspect-video bg-mem-grid">
            {previewType === "video" ? (
              <video
                src={previewUrl}
                controls
                muted
                className="w-full h-full object-contain bg-mem-black"
              />
            ) : (
              <img
                src={previewUrl}
                alt="预览"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {showUploadButton && (
            <div className="p-4 border-t-[3px] border-mem-black flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="space-y-2 flex-1">
                <p className="font-display text-mem-black text-sm flex items-center gap-2">
                  {previewType === "video" ? (
                    <>🎬 {previewFile?.name}</>
                  ) : (
                    <>🖼 {previewFile?.name}</>
                  )}
                </p>
                {uploading && (
                  <div className="h-3 bg-cream border-memphis overflow-hidden">
                    <motion.div
                      className="h-full bg-mem-green"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: "tween", duration: 0.1 }}
                    />
                  </div>
                )}
                {error && (
                  <p className="text-xs font-bold text-mem-red">{error}</p>
                )}
              </div>
              <UiButton color="red" onClick={doUpload} disabled={uploading}>
                {uploading ? `上传中 ${Math.round(progress)}%` : "⬆ 上传到服务器"}
              </UiButton>
            </div>
          )}

          {!showUploadButton && !uploading && value?.url && (
            <div className="p-3 border-t-[3px] border-mem-black bg-mem-green/10">
              <p className="text-xs font-body text-mem-black/70 break-all">
                ✓ 已上传：<code className="marker-yellow">{value.url}</code>
              </p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {error && !hasPreview && (
          <motion.div
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-mem-red text-white font-bold text-sm px-4 py-2 border-memphis shadow-memphis-sm"
          >
            ⚠ {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
