import { Router } from "express";
import { signinSchema, signupSchema } from "../../types";
import {hash,compare} from "../../script";
export const route = Router();
import users from "../../models/users";
import jwt from "jsonwebtoken";
import { userRoute } from "./user";
import { saplingRoute } from "./sapling";
route.post("/login", async(req, res) => {
    console.log("Login request received");
    const parsedData = signinSchema.safeParse(req.body);
    console.log(parsedData);
    if(!parsedData.success){
        return res.status(400).json({ error: parsedData.error });
    }
    try {
        console.log("Finding user");
        const user:any = await users.findOne({email:parsedData.data.email});
        console.log(user);
        if(!user){
            return res.status(400).json({ error: "User not found" });
        }
        console.log("Comparing passwords");
        const isPasswordValid = await compare(parsedData.data.password,user.password);  
        console.log("Password valid:", isPasswordValid);
        if(!isPasswordValid){
            return res.status(400).json({ error: "Invalid password" });
        }
        console.log("Generating token");
        const token = jwt.sign({id:user._id,email:user.email},process.env.JWT_SECRET!,{expiresIn:"1h"});
        console.log("Login successful, sending token");
        res.status(200).send({ token:token });
        
    } catch (err) {
        res.status(500).send({ error: 'Internal server error' });
        return;
    }
});


route.post("/SignUp",async (req, res) => {   

    const parsedData = signupSchema.safeParse(req.body);

    if(!parsedData.success){
        return res.status(400).json({ error: parsedData.error });
    }

    const ifUserExists = await users.findOne({email:parsedData.data.email});
    if(ifUserExists){
        return res.status(400).json({ error: "User already exists" });
    }


    const hashedPassword = await hash(parsedData.data.password);


    const newuser = new users({
        username: parsedData.data.username,
        email: parsedData.data.email,
        password: hashedPassword,
        phone: parsedData.data.phone,
        address: parsedData.data.address,
        coordinates: parsedData.data.coordinates,
        aadhar_number: parsedData.data.aadhar_number,
        signature: parsedData.data.signature,
        ecocredits: parsedData.data.ecocredits ?? 0
    });

    newuser.save().then((user) => {
        res.status(201).json(user);
    }
    ).catch((err) => {
        res.status(400).json({ error: err });
    });    
});

// lowercase alias for signup
route.post("/signup", async (req, res) => {
    (route as any).handle({ ...req, url: "/SignUp" }, res);
});

route.use("/user",userRoute);
route.use("/sapling",saplingRoute);