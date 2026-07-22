import bcrypt from "bcrypt"
import prisma from "../../lib/prisma.js";
import { startOfMonth, today } from "../../constance/index.js";
import { Users } from "@prisma/client";

// 1. DASHBOARD / company admin
export const getCompanyDashboardService = async (companyId: string) => {
    const [totalEmployees, activeEmployees, totalDepartments, presentToday, lateToday, pendingLeaves, approvedLeavesToday, newEmployeesThisMonth, recentEmployees, recentLeaves] = await Promise.all([
        // users
        prisma.users.count({ where: { company_id: companyId, role: { not: "super_admin" } } }),
        prisma.users.count({ where: { company_id: companyId, is_active: true, role: { not: "super_admin" } } }),
        // department
        prisma.department.count({ where: { company_id: companyId } }),
        prisma.attendanceLog.count({ where: { user: { company_id: companyId }, date: { gte: today }, is_late: false, check_in: { not: null } } }),
        prisma.attendanceLog.count({ where: { user: { company_id: companyId }, date: { gte: today }, is_late: true } }),
        prisma.leaveRequest.count({ where: { employee: { company_id: companyId }, status: "pending" } }),
        prisma.leaveRequest.count({ where: { employee: { company_id: companyId }, status: "approved", start_date: { lte: today }, end_date: { gte: today } } }),
        prisma.users.count({ where: { company_id: companyId, created_at: { gte: startOfMonth }, role: { not: "super_admin" } } }),
        prisma.users.findMany({
            where: { company_id: companyId, role: { not: "super_admin" } },
            orderBy: { created_at: "desc" }, take: 5,
            select: { id: true, first_name: true, last_name: true, role: true, created_at: true, department: { select: { name: true } } },
        }),
        prisma.leaveRequest.findMany({
            where: { employee: { company_id: companyId } },
            orderBy: { created_at: "desc" }, take: 5,
            include: { employee: { select: { first_name: true, last_name: true } } },
        }),
    ])

    const attendanceRate = activeEmployees > 0
        ? Math.round(((presentToday + lateToday) / activeEmployees) * 100) : 0

    return {
        stats: {
            employees: { total: totalEmployees, active: activeEmployees, new_this_month: newEmployeesThisMonth },
            departments: { total: totalDepartments },
            attendance: {
                present_today: presentToday,
                late_today: lateToday,
                absent_today: activeEmployees - presentToday - lateToday - approvedLeavesToday,
                on_leave_today: approvedLeavesToday,
                rate: attendanceRate,
            },
            leaves: { pending: pendingLeaves },
        },
        recent: { employees: recentEmployees, leaves: recentLeaves },
    }
}

// 2. GET EMPLOYEES
export const getEmployeesService = async (companyId: string, params: {
    search?: string; role?: string; department_id?: string
    is_active?: string; page?: number; limit?: number
}) => {
    const page = params.page ?? 1; const limit = params.limit ?? 20
    const skip = (page - 1) * limit
    const where: any = { company_id: companyId, role: { not: "super_admin" } }
    if (params.search) where.OR = [
        { first_name: { contains: params.search, mode: "insensitive" } },
        { last_name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
    ]
    if (params.role) where.role = params.role
    if (params.department_id) where.department_id = params.department_id
    if (params.is_active !== undefined) where.is_active = params.is_active === "true"

    const [employees, total] = await Promise.all([
        prisma.users.findMany({
            where, skip, take: limit, orderBy: { created_at: "desc" },
            select: {
                id: true, first_name: true, last_name: true, email: true,
                phone: true, avatar_url: true, role: true, is_active: true,
                hire_date: true, created_at: true,
                department: { select: { id: true, name: true } },
                manager: { select: { id: true, first_name: true, last_name: true } },
            },
        }),
        prisma.users.count({ where }),
    ])
    return { employees, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }
}

// GET BY ID
export const getEmployeeByIdService = async (companyId: string, userId: string) => {
    const user = await prisma.users.findFirst({
        where: { id: userId, company_id: companyId },
        select: {
            id: true, first_name: true, last_name: true, email: true,
            phone: true, avatar_url: true, role: true, is_active: true,
            hire_date: true, birth_date: true, created_at: true,
            department: { select: { id: true, name: true } },
            manager: { select: { id: true, first_name: true, last_name: true } },
            leave_balances: true,
            leave_requests: { orderBy: { created_at: "desc" }, take: 5 },
        },
    })
    if (!user) throw new Error("Employee not found")
    return user
}

// CREATE EMPLOYEE
export const createEmployeeService = async (companyId: string, data: {
    first_name: string; last_name: string; email: string; password: string
    role: "company_admin" | "manager" | "employee"; department_id?: string
    manager_id?: string; phone?: string; hire_date?: string
}) => {
    if (!data.first_name || !data.last_name || !data.email || !data.password)
        throw new Error("Name, email, and password are required")
    const existing = await prisma.users.findUnique({ where: { email: data.email.toLowerCase() } })
    if (existing) throw new Error("Email is already in use")

    const hashed = await bcrypt.hash(data.password, 10)
    const user = await prisma.users.create({
        data: {
            first_name: data.first_name, last_name: data.last_name,
            email: data.email.toLowerCase().trim(), password: hashed,
            role: data.role ?? "employee", company_id: companyId,
            department_id: data.department_id ?? null,
            manager_id: data.manager_id ?? null,
            phone: data.phone ?? null,
            hire_date: data.hire_date ? new Date(data.hire_date) : null,
            is_active: true,
        },
        select: { id: true, first_name: true, last_name: true, email: true, role: true, created_at: true },
    })

    // Seed leave balances
    const policies = await prisma.leavePolicy.findMany({ where: { company_id: companyId } })
    if (policies.length > 0) {
        await prisma.leaveBalance.createMany({
            data: policies.map((p) => ({ user_id: user.id, leave_type: p.leave_type, year: new Date().getFullYear(), total_days: p.days_per_year })),
            skipDuplicates: true,
        })
    }
    return user
}

// UPDATE EMPLOYEE
export const updateEmployeeService = async (companyId: string, userId: string, data: Users) => {
    const user = await prisma.users.findFirst({ where: { id: userId, company_id: companyId } })
    if (!user) throw new Error("Employee not found")
    return prisma.users.update({
        where: { id: userId },
        data: { ...data, hire_date: data.hire_date ? new Date(data.hire_date) : undefined },
        select: { id: true, first_name: true, last_name: true, email: true, role: true, is_active: true },
    })
}

// DELETE EMPLOYEE
export const deleteEmployeeService = async (companyId: string, userId: string) => {
    const user = await prisma.users.findFirst({ where: { id: userId, company_id: companyId } })
    if (!user) throw new Error("Employee not found")
    return prisma.users.update({ where: { id: userId }, data: { is_active: false } })
}

// 3. DEPARTMENTS
export const getDepartmentsService = async (companyId: string) => {
    const departments = await prisma.department.findMany({
        where: { company_id: companyId }, orderBy: { name: "asc" },
        include: {
            manager: { select: { id: true, first_name: true, last_name: true } },
            _count: { select: { employees: true } },
        },
    })
    return departments.map((d) => ({
        id: d.id, name: d.name, manager: d.manager,
        employee_count: d._count.employees, created_at: d.created_at,
    }))
}

export const getDepartmentWithEmployeesService = async (companyId: string, deptId: string) => {
    const dept = await prisma.department.findFirst({
        where: { id: deptId, company_id: companyId },
        include: {
            manager: { select: { id: true, first_name: true, last_name: true } },
            employees: { select: { id: true, first_name: true, last_name: true, email: true, role: true, is_active: true, avatar_url: true } },
        },
    })
    if (!dept) throw new Error("Department not found")
    return dept
}

export const createDepartmentService = async (companyId: string, data: { name: string; manager_id?: string }) => {
    if (!data.name) throw new Error("Department name is required")
    if (data.manager_id) {
        const mgr = await prisma.users.findFirst({ where: { id: data.manager_id, company_id: companyId } })
        if (!mgr) throw new Error("Manager not found in this company")
    }
    return prisma.department.create({
        data: { name: data.name, company_id: companyId, manager_id: data.manager_id ?? null },
        include: { manager: { select: { first_name: true, last_name: true } } },
    })
}

export const updateDepartmentService = async (companyId: string, deptId: string, data: { name?: string; manager_id?: string }) => {
    const dept = await prisma.department.findFirst({ where: { id: deptId, company_id: companyId } })
    if (!dept) throw new Error("Department not found")
    return prisma.department.update({
        where: { id: deptId }, data,
        include: { manager: { select: { first_name: true, last_name: true } }, _count: { select: { employees: true } } },
    })
}

export const deleteDepartmentService = async (companyId: string, deptId: string) => {
    const dept = await prisma.department.findFirst({ where: { id: deptId, company_id: companyId } })
    if (!dept) throw new Error("Department not found")
    const empCount = await prisma.users.count({ where: { department_id: deptId } })
    if (empCount > 0) throw new Error("Cannot delete a department that contains employees")
    await prisma.department.delete({ where: { id: deptId } })
    return { deleted: true }
}