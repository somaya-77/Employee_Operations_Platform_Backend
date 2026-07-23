import prisma from "../../lib/prisma.js"

//  List departments 
export const getDepartmentsService = async (companyId: string) => {
    const departments = await prisma.department.findMany({
        where: { company_id: companyId },
        orderBy: { name: "asc" },
        include: {
            manager: { select: { id: true, first_name: true, last_name: true, avatar_url: true } },
            _count: { select: { employees: true } }
        }
    })

    return departments.map((d) => ({
        id: d.id,
        name: d.name,
        manager: d.manager,
        employee_count: d._count.employees,
        created_at: d.created_at
    }))
};

//  Get department by ID with employees  
export const getDepartmentByIdService = async (companyId: string, deptId: string) => {
    const dept = await prisma.department.findFirst({
        where: { id: deptId, company_id: companyId },
        include: {
            manager: { select: { id: true, first_name: true, last_name: true, avatar_url: true } },
            employees: {
                select: {
                    id: true, first_name: true, last_name: true,
                    email: true, role: true, is_active: true,
                    avatar_url: true, hire_date: true,
                }
            }
        },
    })
    if (!dept) throw new Error("Department not found")
    return dept;
};

//  Org Chart 

export const getOrgChartService = async (companyId: string) => {
    
    const departments = await prisma.department.findMany({
        where: { company_id: companyId },
        orderBy: { name: "asc" },
        include: {
            manager: {
                select: { id: true, first_name: true, last_name: true, avatar_url: true, role: true }
            },
            employees: {
                where: { is_active: true },
                select: {
                    id: true, first_name: true, last_name: true,
                    role: true, avatar_url: true,
                    manager: { select: { id: true, first_name: true, last_name: true } },
                },
            },
            _count: { select: { employees: true } },
        },
    })

    const unassigned = await prisma.users.findMany({
        where: { company_id: companyId, department_id: null, is_active: true, role: { not: "super_admin" } },
        select: { id: true, first_name: true, last_name: true, role: true, avatar_url: true }
    })

    return { departments, unassigned }
};

//  Create Department 
export const createDepartmentService = async (companyId: string, data: { name: string; manager_id?: string }) => {
    if (!data.name?.trim()) throw new Error("Department name is required")
    
    if (data.manager_id) {
        const mgr = await prisma.users.findFirst({ where: { id: data.manager_id, company_id: companyId } })
        if (!mgr) throw new Error("Manager not found in this company")
    }

    return prisma.department.create({
        data: { name: data.name.trim(), company_id: companyId, manager_id: data.manager_id ?? null },
        include: { manager: { select: { first_name: true, last_name: true } } },
    })
};

//  Update Department 
export const updateDepartmentService = async (companyId: string, deptId: string, data: { name?: string; manager_id?: string }) => {
    const dept = await prisma.department.findFirst({ where: { id: deptId, company_id: companyId } })
    if (!dept) throw new Error("Department not found")

    if (data.manager_id) {
        const mgr = await prisma.users.findFirst({ where: { id: data.manager_id, company_id: companyId } })
        if (!mgr) throw new Error("Manager not found")
    }

    return prisma.department.update({
        where: { id: deptId }, 
        data,
        include: { manager: { select: { first_name: true, last_name: true } }, _count: { select: { employees: true } } },
    })
};

//  Delete Department 
export const deleteDepartmentService = async (companyId: string, deptId: string) => {
    const dept = await prisma.department.findFirst({ where: { id: deptId, company_id: companyId } })
    if (!dept) throw new Error("Department not found")

    const empCount = await prisma.users.count({ where: { department_id: deptId } })
    if (empCount > 0) throw new Error("Cannot delete a department that contains employees")

    await prisma.department.delete({ where: { id: deptId } })
    return { deleted: true }
};