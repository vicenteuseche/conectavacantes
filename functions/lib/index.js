"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const createApp_1 = require("./createApp");
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
const app = (0, createApp_1.createApp)();
exports.api = (0, https_1.onRequest)({
    region: "us-central1",
    secrets: [geminiApiKey],
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 120,
    memory: "512MiB"
}, app);
//# sourceMappingURL=index.js.map