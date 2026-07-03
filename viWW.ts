import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createApp } from "./server";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const HMR_PORT = Number(process.env.VITE_HMR_PORT || 24679);

const listenWithFallback = (app: any, port: number, host: string) => {
  const server = app.listen(port, host, () => {
    console.log(`🚀 ConectaVacantes running at http://${host}:${port}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.warn(`Port ${port} is busy. Trying ${port + 1}...`);
      listenWithFallback(app, port + 1, host);
      return;
    }
    console.error(error);
    process.exit(1);
  });
};

async function main() {
  const app = createApp();
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { port: HMR_PORT } },
    appType: "spa"
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const indexPath = path.resolve("index.html");
      let template = await fs.promises.readFile(indexPath, "utf-8");
      template = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (error) {
      next(error);
    }
  });

  listenWithFallback(app, PORT, HOST);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});