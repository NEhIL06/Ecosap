import { NextFunction, Request, Response } from "express";
import Jwt from "jsonwebtoken";
import users from "../models/users";


export const auth = async (req:Request, res:Response, next:NextFunction) => {
    try {
        const token = req.header("authorization")?.replace('Bearer ', '');
        if(!token){
            return res.status(402).json({message:"token is missing"});
        }
        const decoded:any = Jwt.verify(token,process.env.JWT_SECRET!);
        const user = users.findById(decoded.id);
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        req.body.user = user;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        res.status(401).json({message:"Unauthorized"});
    }
}