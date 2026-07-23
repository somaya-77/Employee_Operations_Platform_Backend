import bcrypt from "bcrypt"
import prisma from "../../lib/prisma.js"


//  Create account (company_admin creates manager/employee) 
export const createAccountService = async (
    companyId: string,
    data: {
        first_name: string
        last_name: string
        email: string
        password: string
        role: "manager" | "employee" | "company_admin"
        department_id?: string
        manager_id?: string
        phone?: string
        hire_date?: string
        birth_date?: string
    }
) => {
    //  Validation 
    if (!data.first_name || !data.last_name || !data.email || !data.password) {
        throw new Error("Name, email, and password are required")
    }
    if (data.password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
    }

    // company_admin cannot create super_admin
    if (data.role === ("super_admin" as any)) {
        throw new Error("Creating a Super Admin account is not allowed")
    }

    //  Check email ─
    const existing = await prisma.users.findUnique({
        where: { email: data.email.toLowerCase().trim() },
    })
    if (existing) throw new Error("Email is already in use")

    //  Validate department ─
    if (data.department_id) {
        const dept = await prisma.department.findFirst({
            where: { id: data.department_id, company_id: companyId },
        })
        if (!dept) throw new Error("Department not found in this company")
    }

    //  Validate manager 
    if (data.manager_id) {
        const mgr = await prisma.users.findFirst({
            where: { id: data.manager_id, company_id: companyId, is_active: true },
        })
        if (!mgr) throw new Error("Manager not found or inactive")
    }

    //  Check subscription limit 
    const [subscription, userCount] = await Promise.all([
        prisma.subscription.findUnique({ where: { company_id: companyId } }),
        prisma.users.count({ where: { company_id: companyId, is_active: true } }),
    ])
    if (subscription && userCount >= subscription.max_users) {
        throw new Error(`You have reached the maximum user limit (${subscription.max_users}) for your current subscription plan`)
    }

    //  Hash password 
    const hashed = await bcrypt.hash(data.password, 10)

    //  Create user 
    const user = await prisma.users.create({
        data: {
            first_name: data.first_name.trim(),
            last_name: data.last_name.trim(),
            email: data.email.toLowerCase().trim(),
            password: hashed,
            role: data.role,
            company_id: companyId,
            department_id: data.department_id ?? null,
            manager_id: data.manager_id ?? null,
            phone: data.phone ?? null,
            hire_date: data.hire_date ? new Date(data.hire_date) : null,
            birth_date: data.birth_date ? new Date(data.birth_date) : null,
            is_active: true,
        },
        select: {
            id: true, first_name: true, last_name: true,
            email: true, role: true, created_at: true,
            department: { select: { name: true } },
        },
    })

    //  Seed leave balances 
    const policies = await prisma.leavePolicy.findMany({
        where: { company_id: companyId },
    });
    
    if (policies.length > 0) {
        await prisma.leaveBalance.createMany({
            data: policies.map((p) => ({
                user_id: user.id,
                leave_type: p.leave_type,
                year: new Date().getFullYear(),
                total_days: p.days_per_year,
            })),
            skipDuplicates: true,
        })
    }

    //  Send welcome notification ─
    await prisma.notification.create({
        data: {
            title: "Welcome to the platform",
            message: `Welcome ${user.first_name}, your account has been successfully created. You can now log in.`,
            type: "success",
            channel: "in_app",
            usersId: user.id,
            company_id: companyId,
            sent_at: new Date(),
        },
    })

    return user
}

//  Bulk create accounts 
export const bulkCreateAccountsService = async (
    companyId: string,
    accounts: Array<{
        first_name: string; last_name: string; email: string
        password: string; role: "manager" | "employee"
        department_id?: string
    }>
) => {
    const results: { success: any[]; failed: { email: string; reason: string }[] } = {
        success: [],
        failed: [],
    }

    for (const acc of accounts) {
        try {
            const user = await createAccountService(companyId, acc)
            results.success.push(user)
        } catch (err) {
            results.failed.push({
                email: acc.email,
                reason: err instanceof Error ? err.message : "An error occurred",
            })
        }
    }

    return results
}

//  Get accounts list 
export const getAccountsService = async (
    companyId: string,
    params: {
        search?: string; role?: string; department_id?: string
        is_active?: string; page?: number; limit?: number
    }
) => {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const skip = (page - 1) * limit

    const where: any = {
        company_id: companyId,
        role: { not: "super_admin" },
    }
    if (params.search) {
        where.OR = [
            { first_name: { contains: params.search, mode: "insensitive" } },
            { last_name: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
        ]
    }
    if (params.role) where.role = params.role
    if (params.department_id) where.department_id = params.department_id
    if (params.is_active !== undefined) where.is_active = params.is_active === "true"

    const [users, total] = await Promise.all([
        prisma.users.findMany({
            where, skip, take: limit,
            orderBy: { created_at: "desc" },
            select: {
                id: true, first_name: true, last_name: true,
                email: true, role: true, is_active: true,
                phone: true, hire_date: true, created_at: true,
                avatar_url: true,
                department: { select: { id: true, name: true } },
                manager: { select: { id: true, first_name: true, last_name: true } },
            },
        }),
        prisma.users.count({ where }),
    ])

    return { users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }
}

//  Reset password 
export const resetPasswordService = async (
    companyId: string,
    userId: string,
    newPassword: string
) => {
    const user = await prisma.users.findFirst({
        where: { id: userId, company_id: companyId },
    })
    if (!user) throw new Error("Employee not found")
    if (newPassword.length < 8) throw new Error("Password must be at least 8 characters long")

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.users.update({
        where: { id: userId },
        data: { password: hashed },
    })
    return { success: true }
}

//  Toggle active status 
export const toggleUserStatusService = async (
    companyId: string,
    userId: string
) => {
    const user = await prisma.users.findFirst({
        where: { id: userId, company_id: companyId },
    })
    if (!user) throw new Error("Employee not found")

    return prisma.users.update({
        where: { id: userId },
        data: { is_active: !user.is_active },
        select: { id: true, is_active: true, first_name: true, last_name: true },
    })
}
