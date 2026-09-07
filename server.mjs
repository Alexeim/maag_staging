import { handler as ssrHandler } from "./dist/server/entry.mjs";
import compression from "compression";
import express from "express";
import expressStaticGzip from "express-static-gzip";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = join(__dirname, "dist", "client");
const app = express();

// Serve pre-compressed static files (.br, .gz created by astro-compressor at build time)
app.use(
  "/",
  expressStaticGzip(clientDir, {
    enableBrotli: true,
    orderPreference: ["br", "gz"],
    index: false,
    serveStatic: {
      index: false,
      maxAge: "1y",
      immutable: true,
    },
  }),
);

// Compress SSR responses (HTML/JSON/SVG/XML). astro-compressor only pre-compresses
// the static build output in dist/client; anything rendered on the fly by the Astro
// handler below goes out uncompressed without this. compression >=1.8 negotiates
// brotli (quality 4 — cheap enough for per-request SSR) or gzip via Accept-Encoding,
// skips responses that already carry Content-Encoding, and installs res.flush so
// Astro's streamed HTML keeps flowing.
app.use(compression());

// Astro SSR handler for all dynamic routes
app.use(ssrHandler);

const port = process.env.PORT || 8080;
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  console.log(`Server running on ${host}:${port}`);
});
