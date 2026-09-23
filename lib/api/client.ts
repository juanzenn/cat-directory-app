import axios from "axios";

export const catFactApi = axios.create({
  baseURL: "https://catfact.ninja",
  headers: { Accept: "application/json" },
});
