import express from "express";
import cors from "cors";
import { route } from "./router/v1";
import dotenv from "dotenv";
const app = express();

import mongoose from "mongoose";
dotenv.config();

const db_string = process.env.DB_CONN_STRING!;
export const connection = mongoose.connect(db_string)
.then(()=>{console.log("Database connected")})
.catch((err)=>{console.log(err)});

app.use(express.json());

app.use(cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));

app.use("/api/v1", route);

app.listen(3000, () => {    
    console.log("Server is running on port 3000");
});
