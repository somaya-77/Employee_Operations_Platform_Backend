// src/routes/account.routes.ts
import { Router } from "express"
import {
    getAccounts, createAccount, bulkCreateAccounts,
    resetPassword, toggleStatus,
} from "../../controllers/company-admin/account.controller.js"
import { requireRole, verifyToken } from "../../lib/auth.middleware.js"

const router = Router()
router.use(verifyToken, requireRole("company_admin"));

router.get("/", verifyToken, getAccounts)
router.post("/", verifyToken, createAccount)
router.post("/bulk", verifyToken, bulkCreateAccounts)
router.patch("/:id/reset-password", verifyToken, resetPassword)
router.patch("/:id/toggle-status", verifyToken, toggleStatus)

export default router