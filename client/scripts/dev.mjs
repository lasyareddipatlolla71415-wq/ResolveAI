import react from "@vitejs/plugin-react";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";

const server = await createServer({
  cacheDir: join(tmpdir(), "resolveai-vite-cache"),
  configFile: false,
  plugins: [react()],
  server: {
    port: 5173
  }
});

await server.listen();
server.printUrls();
