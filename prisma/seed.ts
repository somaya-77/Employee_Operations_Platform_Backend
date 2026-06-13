import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";


const prisma = new PrismaClient();

async function main() {
    // Create Super Admin user
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "super@empops.io";
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2024!";

    const hashedPassword = await bcrypt.hash(
        superAdminPassword,
        10
    );

    await prisma.user.create({
        data: {
            email: superAdminEmail,
            password: hashedPassword,
            first_name: "Super",
            last_name: "Admin",
            role: "super_admin"
        }
    });
    console.log("Super Admin user created successfully.");
}


main().catch(console.error).finally(() => prisma.$disconnect()); 