import type { LoaderFunctionArgs } from "react-router";
import { getUserToken } from "~/.server/sessions";
import { api } from "~/.server/lib/api";

/**
 * Resource route for PDF report download
 * 
 * URL: /resources/reports/:id/pdf
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await getUserToken(request);
  const { id } = params;

  if (!id) {
    return new Response("Report ID is required", { status: 400 });
  }

  try {
    // Forward to Django backend using api.raw for non-JSON response
    const response = await api.raw(
      `/api/reports/${id}/export/pdf/`,
      {
        method: "GET",
        token,
      },
      undefined,
      request,
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Failed to generate PDF");
      return new Response(errorText, {
        status: response.status,
        statusText: response.statusText,
      });
    }

    // Get the raw body stream from the backend response
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `Assessment_${id}_Report.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Return the response body directly with proper headers
    // This preserves the stream from Django without converting to blob
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response("Failed to generate PDF report", {
      status: 500,
    });
  }
}
