import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoaderFunctionArgs } from "react-router";

const getUserTokenMock = vi.fn();
const apiRawMock = vi.fn();

vi.mock("~/.server/sessions", () => ({
  getUserToken: getUserTokenMock,
}));

vi.mock("~/.server/lib/api", () => ({
  api: {
    raw: apiRawMock,
  },
}));

describe("resources.reports.$id.pdf loader", () => {
  beforeEach(() => {
    vi.resetModules();
    getUserTokenMock.mockReset();
    apiRawMock.mockReset();
  });

  it("forwards the original request so the active organization header is preserved", async () => {
    getUserTokenMock.mockResolvedValue("token-123");
    apiRawMock.mockResolvedValue(
      new Response("pdf-bytes", {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="report.pdf"',
        },
      }),
    );

    const { loader } = await import("~/routes/resources.reports.$id.pdf");
    const request = new Request("http://localhost:5173/resources/reports/report-1/pdf", {
      headers: {
        Cookie: "__session=test; veris_selected_organization=org-123",
      },
    });

    const response = await loader({
      request,
      params: { id: "report-1" },
      context: {},
    } as unknown as LoaderFunctionArgs);

    expect(apiRawMock).toHaveBeenCalledWith(
      "/api/reports/report-1/export/pdf/",
      {
        method: "GET",
        token: "token-123",
      },
      undefined,
      request,
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="report.pdf"',
    );
  });
});
