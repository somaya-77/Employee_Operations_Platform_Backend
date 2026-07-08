import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
// import prisma from "../lib/prisma";


export const loginService = async (email: string, password: string) => {
    console.log("DEBUG: Service called with email:", email);
    // Check email & password
    if (!email || !password) {
        throw new Error("Email and password are required");
    }
    console.log("DEBUG: Attempting to find user in DB...");

    // 1. Find user by email in database
    // const user = await prisma.user.findUnique({ where: { email } });


    const user = await prisma.users.findFirst({
        where: { email: email }
    });

    console.log("DEBUG: User found in DB:", !!user);
    // Check if user exists
    if (!user) {
        throw new Error("User not found");
    }


    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is missing");
    }

    // 3. Generate JWT token (for simplicity, we return user info here)
    const token = jwt.sign({
        userId: user.id,
        role: user.role,
        companyId: user.company_id,
    }, secret, { expiresIn: '7d' });

    // 4. Return token and user info (excluding password)
    return { token, user: { id: user.id, email: user.email, role: user.role, companyId: user.company_id } }

}