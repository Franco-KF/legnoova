import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const downloads = {
  bridge: { filename: "bridge.py", contentType: "text/x-python; charset=utf-8" },
  ea: { filename: "LegnoovaBridgeEA.mq5", contentType: "text/plain; charset=utf-8" },
  guide: { filename: "README.md", contentType: "text/markdown; charset=utf-8" },
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  if (!Object.hasOwn(downloads, file)) return new Response("Not found", { status: 404 });

  const download = downloads[file as keyof typeof downloads];
  const contents = await readFile(path.join(process.cwd(), "integrations", "mt5", download.filename));
  return new Response(contents, {
    headers: {
      "Content-Type": download.contentType,
      "Content-Disposition": `attachment; filename="${download.filename}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
