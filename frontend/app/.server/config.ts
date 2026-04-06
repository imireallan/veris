/** Centralized env config for API endpoints.
 * Works in both SSR (React Router server) and client-side builds.
 *
 * SSR context → process.env
 * Browser context → import.meta.env (Vite replaces at build time)
 */

const isServer = typeof process !== "undefined" && process.env;

export const API_URL = isServer
  ? process.env.BACKEND_URL || "http://backend:8000"
  : import.meta.env.VITE_API_URL || "http://localhost:8000";

export const AI_API_URL = isServer
  ? process.env.AI_BACKEND_URL || "http://ai_engine:8001"
  : import.meta.env.VITE_AI_API_URL || "http://localhost:8001";
