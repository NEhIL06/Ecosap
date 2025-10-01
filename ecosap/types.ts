import z from 'zod';

export const signinSchema = z.object({
    email: z.string().email(),
    password:z.string().min(6).max(20)
})


export const signupSchema = z.object({
    name:z.string(),
    email: z.string().email(),
    password:z.string().min(6).max(20),
    phone:z.string().min(10).max(10),
    address:z.string().min(10).max(100),
    coordinates:z.object({
        latitude:z.number(),
        longitude:z.number()
    }),
    aadhar_number:z.string().min(12).max(12),
    signature:z.string()
})