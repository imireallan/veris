import type { LoaderFunctionArgs } from "react-router";
import { API_URL } from "~/.server/lib/api";

const PASSTHROUGH_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-disposition",
  "accept-ranges",
  "content-range",
  "last-modified",
  "etag",
  "cache-control",
] as const;

function copyRequestHeaders(request: Request) {
  const headers = new Headers();
  const range = request.headers.get("range");
  const ifNoneMatch = request.headers.get("if-none-match");
  const ifModifiedSince = request.headers.get("if-modified-since");

  if (range) headers.set("range", range);
  if (ifNoneMatch) headers.set("if-none-match", ifNoneMatch);
  if (ifModifiedSince) headers.set("if-modified-since", ifModifiedSince);

  return headers;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const mediaPath = params["*"];

  if (!mediaPath) {
    return new Response("Media path is required", { status: 400 });
  }

  const sourceUrl = new URL(request.url);
  const backendUrl = `${API_URL}/media/${mediaPath}${sourceUrl.search}`;
  const backendResponse = await fetch(backendUrl, {
    method: request.method,
    headers: copyRequestHeaders(request),
  });

  const headers = new Headers();
  for (const headerName of PASSTHROUGH_RESPONSE_HEADERS) {
    const value = backendResponse.headers.get(headerName);
    if (value) headers.set(headerName, value);
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers,
  });
}
