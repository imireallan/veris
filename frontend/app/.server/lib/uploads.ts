/**
 * File upload utilities for React Router v7 server-side actions.
 * Uses form-data for multipart uploads to external APIs.
 */

type UploadableFile = File | Blob;

export async function uploadFileToApi(
  file: UploadableFile,
  endpoint: string,
  options?: {
    token?: string | null;
    organizationId?: string | null;
  },
): Promise<Response> {
  const formData = new FormData();

  formData.append(
    "file",
    file,
    file instanceof File ? file.name : "upload",
  );

  const headers: Record<string, string> = {};

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options?.organizationId) {
    headers["X-Organization-Id"] = options.organizationId;
  }

  return fetch(endpoint, {
    method: "POST",
    headers,
    body: formData,
  });
}

export async function uploadFile<T>(
  file: UploadableFile,
  endpoint: string,
  options?: {
    token?: string | null;
    organizationId?: string | null;
  },
): Promise<T> {
  const response = await uploadFileToApi(file, endpoint, options);

  if (!response.ok) {
    const responseText = await response.text();
    let errorBody: any = {};

    try {
      errorBody = responseText ? JSON.parse(responseText) : {};
    } catch {
      const preview = responseText.slice(0, 120).replace(/\s+/g, " ").trim();
      throw new Error(
        preview
          ? `Upload failed (${response.status}): backend returned non-JSON response: ${preview}`
          : `Upload failed (${response.status})`,
      );
    }

    const error = errorBody?.error || errorBody?.detail || "Upload failed";
    throw new Error(error);
  }

  return (await response.json()) as T;
}