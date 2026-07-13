import { Request, Response } from "express";
import {
  getStatsService,
  createCompanyService,
  listCompaniesService,
  toggleCompanyStatusService,
  updateCompanyService,
  deleteCompanyService,
  showCompanyById,
} from "../services/company.service.js";

// POST /api/companies 
// Super Admin only
// Create company + admin user in one request
export const createCompany = async (req: Request, res: Response) => {
  try {
    // Company data
    const {
      company_name,
      company_domain,
      admin_first_name,
      admin_last_name,
      admin_email,
      admin_password,
    } = req.body;

    // Result
    const result = await createCompanyService({
      company_name,
      company_domain,
      admin_first_name,
      admin_last_name,
      admin_email,
      admin_password,
    });

    return res.status(201).json({ message: "Successfully created company and admin user", data: result });

  } catch (error) {

    return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" });
  }
};

// SHOW /api/companies/[id]
export const showCompany = async (req: Request, res: Response) => {
  try {
    const rowId = req.params.id;
    const id = Array.isArray(rowId) ? rowId[0] : rowId;
    const company = await showCompanyById(id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    return res.status(200).json({ data: company });
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : "An error occurred" });
  }
}

// UPDATE /api/companies/:id
export const updateCompany = async (req: Request, res: Response) => {
  try {
    const rowId = req.params.id;
    const id = Array.isArray(rowId) ? rowId[0] : rowId;
    const result = await updateCompanyService(id, req.body);
    return res.status(200).json({ message: "Company updated successfully", data: result });
  } catch (error: unknown) {
    return res.status(400).json({ message: error });
  }
};
// SOFT DELETE
// DELETE /api/companies/:id
export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const rowId = req.params.id;
    const id = Array.isArray(rowId) ? rowId[0] : rowId;
    await deleteCompanyService(id);
    return res.status(200).json({ message: "Company deleted successfully" })
  } catch (error: unknown) {
    return res.status(400).json({ message: error })
  }
}

// GET /api/companies 
export const listCompanies = async (req: Request, res: Response) => {
  try {
    const rawStatus = req.query.status as string | string[] | undefined;
    const status = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;

    const companies = await listCompaniesService(status ?? undefined);

    return res.status(200).json({ data: companies });
  } catch (error) {
    console.error("listCompanies Error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "An error occurred",
    });
  }
};

//  GET /api/companies/stats 
export const getStats = async (req: Request, res: Response) => {
  try {
    const searchQuery = req.query.search as string;

    const stats = await getStatsService(searchQuery);

    return res.status(200).json({ data: stats });
  } catch (error) {
    console.error("getStats Error:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "An error occurred",
    });
  }
};

//  PATCH /api/companies/:id/status 
export const toggleStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string | undefined;
    if (!id) {
      return res.status(400).json({ message: "company id is required" });
    }

    const rawStatus = req.body.status as string | string[] | undefined;
    const statusVal = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;

    if (statusVal !== "active" && statusVal !== "suspended") {
      return res.status(400).json({
        message: "status must be either active or suspended",
      });
    }

    const statusFinal = statusVal as "active" | "suspended";

    const company = await toggleCompanyStatusService(id, statusFinal);

    console.log("toggleStatus:", company.name, "→", statusFinal);

    return res.status(200).json({
      message: `Successfully ${statusFinal === "active" ? "activated" : "suspended"} the company`,
      data: company,
    });
  } catch (error) {
    console.error("toggleStatus Error:", error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : "An error occurred",
    });
  }
};
