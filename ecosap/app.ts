import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { route } from "./router/v1";
import mongoose from "mongoose";

dotenv.config();

const app = express();

// Database connection (in serverless, ensure pooled/once)
const dbString = process.env.DB_CONN_STRING!;
mongoose.connect(dbString).then(() => {
    console.log("Database connected");
}).catch((err) => {
    console.log(err);
});

app.use(express.json());

app.use(cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));

app.use("/api/v1", route);

export default app;

