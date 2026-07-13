
import { Router } from "express";
import { requireRole, verifyToken } from "../lib/auth.middleware.js";
import { createCompany, deleteCompany, getStats, listCompanies, toggleStatus, updateCompany } from "../controllers/company.controller.js";


const router = Router();

// ── Super Admin only ──────────────────────────────────
// GET  /api/companies/stats    ← Dashboard stats
// GET  /api/companies          ← List all companies
// POST /api/companies          ← Create company + admin
// PATCH /api/companies/:id/status

router.get("/stats", verifyToken, requireRole("super_admin"), getStats);
router.post("/", verifyToken, requireRole("super_admin"), createCompany);
router.put("/:id",verifyToken, requireRole("super_admin"), updateCompany);
router.delete("/:id",verifyToken, requireRole("super_admin"), deleteCompany);
router.get("/", verifyToken, requireRole("super_admin"), listCompanies);
router.patch("/:id/status", verifyToken, requireRole("super_admin"), toggleStatus);

export default router;
