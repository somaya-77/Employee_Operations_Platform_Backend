
import { Request, Response } from "express"
import {
    createAccountService,
    bulkCreateAccountsService,
    getAccountsService,
    resetPasswordService,
    toggleUserStatusService,
} from "../../services/company-admin/account.service.js"

const cid = (req: Request) => req.user!.companyId as string
const rol = (req: Request) => req.user!.role as string

// GET /api/accounts
export const getAccounts = async (req: Request, res: Response) => {
    try {
        const { search, role, department_id, is_active, page, limit } = req.query
        const data = await getAccountsService(cid(req), {
            search: search as string,
            role: role as string,
            department_id: department_id as string,
            is_active: is_active as string,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        })
        return res.status(200).json({ data })
    } catch (error) {
        console.error("getAccounts Error:", error)
        return res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

// POST /api/accounts
export const createAccount = async (req: Request, res: Response) => {
    try {
        const data = await createAccountService(cid(req), req.body)
        console.log("createAccount: success →", data.email)
        return res.status(201).json({ message: "Account created successfully", data })
    } catch (error) {
        console.error("createAccount Error:", error)
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

// POST /api/accounts/bulk
export const bulkCreateAccounts = async (req: Request, res: Response) => {
    try {
        const { accounts } = req.body
        if (!Array.isArray(accounts) || accounts.length === 0) {
            return res.status(400).json({ message: "accounts must be a non-empty array" })
        }
        if (accounts.length > 50) {
            return res.status(400).json({ message: "Maximum limit is 50 accounts at a time" })
        }
        const data = await bulkCreateAccountsService(cid(req), accounts)
        return res.status(201).json({
            message: `Successfully created ${data.success.length} accounts, failed ${data.failed.length}`,
            data,
        })
    } catch (error) {
        console.error("bulkCreateAccounts Error:", error)
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

// PATCH /api/accounts/:id/reset-password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const rowId = req.params.id;
        const id = Array.isArray(rowId) ? rowId[0] : rowId;
        const { new_password } = req.body
        if (!new_password) {
            return res.status(400).json({ message: "new_password is required" })
        }
        await resetPasswordService(cid(req), id, new_password)
        return res.status(200).json({ message: "Password updated successfully" })
    } catch (error) {
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}

// PATCH /api/accounts/:id/toggle-status
export const toggleStatus = async (req: Request, res: Response) => {
    try {
        const rowId = req.params.id;
        const id = Array.isArray(rowId) ? rowId[0] : rowId;
        const data = await toggleUserStatusService(cid(req), id)
        return res.status(200).json({
            message: `Account has been ${data.is_active ? "activated" : "deactivated"} successfully`,
            data,
        })
    } catch (error) {
        return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" })
    }
}
