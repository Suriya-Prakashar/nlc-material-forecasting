import axios from "axios";

// Dev: leave empty so requests go to the Vite dev server and `/api` is proxied to the backend.
// Prod: set `VITE_API_BASE_URL` to your public API origin (no trailing slash), e.g. https://api.example.com
const baseURL = (import.meta.env.VITE_API_BASE_URL || "").trim();

const api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
});

export default api;
