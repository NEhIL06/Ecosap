import { Router } from "express";
import { auth } from "../../middleware/auth";

export const userRoute = Router();

userRoute.get("/me",auth,async(req,res)=>{
    const user = req.body.user;
    res.status(200).json({user});
})


userRoute.post("/update",auth,async(req,res)=>{
    const user = req.body.user;
    const updates = req.body.updates;
    try {
        for(const key in updates){
            user[key] = updates[key];
        }
        await user.save();
        res.status(200).json({user});
    } catch (error) {
        res.status(400).json({error});
    }
})


userRoute.post("/delete",auth,async(req,res)=>{
    const user = req.body.user;
    try {
        await user.remove();
        res.status(200).json({message:"User deleted"});
    } catch (error) {
        res.status(400).json({error});
    }
})  

