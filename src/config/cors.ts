import dotenv from "dotenv";

dotenv.config();

export type CorsOptions = {
  origin: string | undefined;
  credentials: boolean;
  methods: string[];
  exposedHeaders: string[];
};

export const corsOptions: CorsOptions = {
  origin: process.env.CORS_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  exposedHeaders: ["Location"],
};
