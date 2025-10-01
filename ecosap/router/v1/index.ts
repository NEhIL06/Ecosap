import { Router } from "express";
import { signinSchema, signupSchema } from "../../types";
import {hash,compare} from "../../script";
export const route = Router();
import users from "../../models/users";
import jwt from "jsonwebtoken";
import { userRoute } from "./user";
import { saplingRoute } from "./sapling";
route.post("/login", async(req, res) => {
    const parsedData = signinSchema.safeParse(req.query);
    if(!parsedData.success){
        return res.status(400).json({error:parsedData.error});
    }
    try {
        const user:any = await users.findOne({email:parsedData.data.email});
        if(!user){
            return res.status(400).json({error:"User not found"});
        }
        const isPasswordValid = await compare(parsedData.data.password,user.password);  
        if(!isPasswordValid){
            return res.status(400).json({error:"Invalid password"});
        }

        const token = jwt.sign({id:user._id,email:user.email},process.env.JWT_SECRET!,{expiresIn:"1h"});

        res.status(200).send({token});
        
    } catch (err) {
        res.send({error:err});
        return;
    }
});


route.post("/SignUp",async (req, res) => {   

    const parsedData = signupSchema.safeParse(req.body);

    if(!parsedData.success){
        return res.status(400).json({error:parsedData.error});
    }

    const ifUserExists = await users.findOne({email:parsedData.data.email});
    if(ifUserExists){
        return res.status(400).json({error:"User already exists"});
    }


    const hashedPassword = await hash(req.body.password);


    const newuser = new users({
        username: req.body.username,        
        email: req.body.email,
        password: hashedPassword,
        phone: req.body.phone,
        address: req.body.address,
        coordinates: req.body.coordinates,
        aadhar_number: req.body.aadhar_number,
        signature: req.body.signature,
        ecocredits: req.body.ecocredits
    });

    newuser.save().then((user) => {
        res.status(201).json(user);
    }
    ).catch((err) => {
        res.status(400).json({error:err});
    });    
});

route.use("/user",userRoute);
route.use("/sapling",saplingRoute);