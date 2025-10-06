import { NextFunction, Request, Response } from "express";
import Jwt from "jsonwebtoken";
import users from "../models/users";

// Extend the Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: any; // Replace 'any' with your User type
        }
    }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Authenticating request");
        const authHeader = req.header("authorization") || req.header("Authorization");
        
        if (!authHeader) {
            return res.status(401).json({ message: "Authorization header missing" });
        }
        
        const headerValue = authHeader.trim();
        if (!headerValue) {
            return res.status(401).json({ message: "Authorization header is empty" });
        }
        
        const bearerPrefix = /^Bearer\s+/i;
        if (!bearerPrefix.test(headerValue)) {
            return res.status(401).json({ message: "Invalid authorization format" });
        }
        
        const token = headerValue.replace(bearerPrefix, '').trim();
        console.log("Token:", token);
        
        if (!token) {
            return res.status(401).json({ message: "Token is missing" });
        }
        
        console.log("Verifying token");
        const decoded: any = Jwt.verify(token, process.env.JWT_SECRET!);
        console.log("Token decoded:", decoded);
        
        const user = await users.findById(decoded.id);
        console.log("User found:", user);
        
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        
        console.log("Authentication successful");
        req.user = user;
        next();
    } catch (error: any) {
        console.error("Auth error:", error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(401).json({ message: "Unauthorized" });
    }
}