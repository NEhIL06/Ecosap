import mongoose from "mongoose";

export const connection = mongoose.connect(process.env.DB_CONN_STRING!)
.then(()=>{console.log("Database connected")})
.catch((err)=>{console.log(err)});

