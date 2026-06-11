import { Request, Response } from 'express';
import { loginService } from '../services/auth.service.js';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;


        console.log("Body:", email);
        // result 
        const result = await loginService(email, password);
        console.log("Controller Success");
        return res.status(200).json(result);

    } catch (error) {
        console.error("Controller Error:", error);
        console.error(error);
        return res.status(401).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
}