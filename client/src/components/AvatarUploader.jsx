
import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const inputRef = useRef(null);

  // Task 3: Create and clean up the preview URL.
  useEffect(() => {
    if (!preview) return;

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Task 2 and Task 3: Validate the file and show its preview.
  function handleFile(selectedFile) {
    if (!selectedFile) return;

    setError("");
    setUploadedUrl("");
    setProgress(0);

    if (!ALLOWED.includes(selectedFile.type)) {
      setFile(null);
      setPreview("");
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setFile(null);
      setPreview("");
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  // Task 1: Drag-and-drop handlers.
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }

  // Task 4: Upload with Axios and progress.
  async function upload() {
    if (!file || uploading) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setError("");
    setProgress(0);
    setUploadedUrl("");
    setUploading(true);

    try {
      const response = await apiClient.post(
        "/api/upload",
        formData,
        {
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round(
                (event.loaded * 100) / event.total
              );
              setProgress(percent);
            }
          },
        }
      );

      setProgress(100);

      const url =
        response.data.url ??
        response.data.avatarUrl ??
        response.data.avatar?.url;

      if (url) {
        setUploadedUrl(url);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        className={`drop-zone ${isDragging ? "dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <p>Drag an image here, or click to choose</p>
        <p>JPEG, PNG, WebP, GIF — maximum 5 MB</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>

      {preview && (
        <div className="preview">
          <img src={preview} alt="Selected avatar preview" />
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <button
        type="button"
        onClick={upload}
        disabled={!file || uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {(uploading || progress > 0) && (
        <div>
          <div
            className="bar"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>{progress}%</p>
        </div>
      )}

      {uploadedUrl && (
        <p>
          Upload successful!{" "}
          <a href={uploadedUrl} target="_blank" rel="noreferrer">
            View uploaded image
          </a>
        </p>
      )}
    </div>
  );
}
