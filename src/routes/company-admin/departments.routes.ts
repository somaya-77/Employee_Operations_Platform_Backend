import { Router } from "express";
import { requireRole, verifyToken } from "../../lib/auth.middleware.js";
import { createDepartment, deleteDepartment, getDepartmentById, getDepartments, getOrgChart, updateDepartment } from "../../controllers/company-admin/department.controller.js";



const router = Router();

router.use(verifyToken, requireRole("company_admin"));


//  Departments 
router.get("/org-chart", verifyToken, getOrgChart)
router.get("/", verifyToken, getDepartments)
router.get("/:id", verifyToken, getDepartmentById)
router.post("/", verifyToken, createDepartment)
router.patch("/:id", verifyToken, updateDepartment)
router.delete("/:id", verifyToken, deleteDepartment)

export default router