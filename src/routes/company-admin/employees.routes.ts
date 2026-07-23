
import { Router } from "express"
import {
    getDashboard,
    getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee,
    assignEmployee,
} from "../../controllers/company-admin/employees.controller.js"
import { requireRole, verifyToken } from "../../lib/auth.middleware.js"

const router = Router();

router.use(verifyToken, requireRole("company_admin"));
//  Dashboard 
router.get("/dashboard", getDashboard)

//  Employees 
router.get("/", getEmployees)
router.post("/", createEmployee)
router.get("/:id", getEmployeeById)
router.patch("/:id", updateEmployee)
router.delete("/:id", deleteEmployee)
router.patch("/:id/assign/:userId", assignEmployee)




export default router
