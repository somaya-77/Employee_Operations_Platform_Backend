
import { Request, Response } from "express"
import {
    createDepartmentService, 
    updateDepartmentService, 
    deleteDepartmentService,
    getOrgChartService,
    getDepartmentByIdService,
    getDepartmentsService,
} from "../../services/company-admin/department.service.js"

const cid = (req: Request) => req.user!.companyId as string;

// Get all departments
export const getDepartments = async (req: Request, res: Response) => {
    try {
        const data = await getDepartmentsService(cid(req))
        return res.status(200).json({ data })
    } catch (error) {
        console.error("getDepartments Error:", error)
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

// Get department by ID
export const getDepartmentById = async (req: Request, res: Response) => {
    try {
        const rowId = req.params.id;
        const id = Array.isArray(rowId) ? rowId[0] : rowId;
        const data = await getDepartmentByIdService(cid(req), id)
        return res.status(200).json({ data })
    } catch (error) {
        console.error("getDepartmentById Error:", error)
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

// Get Org Chart
export const getOrgChart = async (req: Request, res: Response) => {
    try {
        const data = await getOrgChartService(cid(req))
        return res.status(200).json({ data })
    } catch (error) {
        console.error("getOrgChart Error:", error)
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
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

