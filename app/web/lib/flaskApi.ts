import axios from "axios";

const FLASK_BASE_URL =
  process.env.NEXT_PUBLIC_FLASK_API ?? "http://localhost:8001/api";

export const flaskApi = axios.create({ baseURL: FLASK_BASE_URL });
