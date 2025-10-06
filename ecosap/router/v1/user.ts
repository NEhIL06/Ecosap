import { Router } from "express";
import { auth } from "../../middleware/auth";
import users from "../../models/users";
export const userRoute = Router();

userRoute.get("/me",auth,async(req,res)=>{
    const user = req.user;
    const currectUser = await users.findById(user._id);
    if(!currectUser){
        return res.status(404).json({error:"User not found"});
    }
    res.status(200).json({user:currectUser});
})


userRoute.post("/update",auth,async(req,res)=>{
    const user = req.user;
    const updates = req.body.updates;
    try {
        // allowlist of updatable fields
        const allowedFields = new Set([
            'username',
            'phone',
            'address',
            'coordinates',
            'signature'
        ]);
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ error: 'updates must be an object' });
        }
        for (const key in updates) {
            if (allowedFields.has(key)) {
                user[key] = updates[key];
            }
        }
        await user.save();
        res.status(200).json({user});
    } catch (error) {
        res.status(400).json({error});
    }
})


userRoute.post("/delete",auth,async(req,res)=>{
    const user = req.user;
    try {
        await user.remove();
        res.status(200).json({message:"User deleted"});
    } catch (error) {
        res.status(400).json({error});
    }
})  

