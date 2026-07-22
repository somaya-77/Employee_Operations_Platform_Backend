
import { Router } from "express"
import {
    getDashboard,
    getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee,
    getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment,
} from "../../controllers/company-admin/company-admin.controller.js"
import { requireRole, verifyToken } from "../../lib/auth.middleware.js"

const router = Router();

router.use(verifyToken, requireRole("company_admin"));
//  Dashboard 
router.get("/dashboard", getDashboard)

//  Employees 
router.get("/employees", getEmployees)
router.post("/employees", createEmployee)
router.get("/employees/:id", getEmployeeById)
router.patch("/employees/:id", updateEmployee)
router.delete("/employees/:id", deleteEmployee)

//  Departments 
router.get("/departments", getDepartments)
router.post("/departments", createDepartment)
router.get("/departments/:id", getDepartmentById)
router.patch("/departments/:id", updateDepartment)
router.delete("/departments/:id", deleteDepartment)

export default router
