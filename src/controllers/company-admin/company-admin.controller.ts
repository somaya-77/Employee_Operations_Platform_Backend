
import { Request, Response } from "express"
import {
    getCompanyDashboardService,
    getEmployeesService, getEmployeeByIdService, createEmployeeService,
    updateEmployeeService, deleteEmployeeService,
    getDepartmentsService, getDepartmentWithEmployeesService,
    createDepartmentService, updateDepartmentService, deleteDepartmentService,
} from "../../services/company-admin/company-admin.service.js"

const cid = (req: Request) => req.user!.companyId as string

//  DASHBOARD 
export const getDashboard = async (req: Request, res: Response) => {
    try {
        const data = await getCompanyDashboardService(cid(req))
        return res.status(200).json({ data })
    } catch (error) {
        console.error("getDashboard Error:", error)
        return res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

//  EMPLOYEES 
export const getEmployees = async (req: Request, res: Response) => {
    try {
        const { search, role, department_id, is_active, page, limit } = req.query
        const data = await getEmployeesService(cid(req), {
            search: search as string,
            role: role as string,
            department_id: department_id as string,
            is_active: is_active as string,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        })
        return res.status(200).json({ data })
    } catch (error) {
        console.error("getEmployees Error:", error)
        return res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

export const getEmployeeById = async (req: Request, res: Response) => {
    try {
        const rowId = req.params.id;
        const id = Array.isArray(rowId) ? rowId[0] : rowId;
        const data = await getEmployeeByIdService(cid(req), id)
        return res.status(200).json({ data })
    } catch (error) {
        console.error("getEmployeeById Error:", error)
        return res.status(404).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

export const createEmployee = async (req: Request, res: Response) => {
    try {
        const data = await createEmployeeService(cid(req), req.body)
        console.log("createEmployee: success →", data.email)
        return res.status(201).json({ message: "Account created successfully", data })
    } catch (error) {
        console.error("createEmployee Error:", error)
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const rowId = req.params.id;
        const id = Array.isArray(rowId) ? rowId[0] : rowId;
        const data = await updateEmployeeService(cid(req), id, req.body)
        return res.status(200).json({ message: "Employee details updated successfully", data })
    } catch (error) {
        console.error("updateEmployee Error:", error)
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

export const deleteEmployee = async (req: Request, res: Response) => {
    try {
        const rowId = req.params.id;
        const id = Array.isArray(rowId) ? rowId[0] : rowId;
        await deleteEmployeeService(cid(req), id)
        return res.status(200).json({ message: "Employee account deactivated successfully" })
    } catch (error) {
        console.error("deleteEmployee Error:", error)
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

//  DEPARTMENTS 
export const getDepartments = async (req: Request, res: Response) => {
    try {
        const data = await getDepartmentsService(cid(req))
        return res.status(200).json({ data })
    } catch (error) {
        console.error("getDepartments Error:", error)
        return res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

export const getDepartmentById = async (req: Request, res: Response) => {
    try {
        const rowId = req.params.id;
        const id = Array.isArray(rowId) ? rowId[0] : rowId;
        const data = await getDepartmentWithEmployeesService(cid(req), id)
        return res.status(200).json({ data })
    } catch (error) {
        console.error("getDepartmentById Error:", error)
        return res.status(404).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const data = await createDepartmentService(cid(req), req.body)
        return res.status(201).json({ message: "Department created successfully", data })
    } catch (error) {
        console.error("createDepartment Error:", error)
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const rowId = req.params.id;
        const id = Array.isArray(rowId) ? rowId[0] : rowId;
        const data = await updateDepartmentService(cid(req), id, req.body)
        return res.status(200).json({ message: "Department updated successfully", data })
    } catch (error) {
        console.error("updateDepartment Error:", error)
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const rowId = req.params.id;
        const id = Array.isArray(rowId) ? rowId[0] : rowId;
        await deleteDepartmentService(cid(req), id)
        return res.status(200).json({ message: "Department deleted successfully" })
    } catch (error) {
        console.error("deleteDepartment Error:", error)
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

