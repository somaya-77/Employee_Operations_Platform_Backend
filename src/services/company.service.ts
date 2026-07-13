// src/services/company.service.ts
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { CreateCompanyInput } from "../types/index.js";

//  createCompanyService 
// Super Admin only: creates company + company_admin account
export const createCompanyService = async (input: CreateCompanyInput) => {
  // Company Data
  const {
    company_name,
    company_domain,
    admin_first_name,
    admin_last_name,
    admin_email,
    admin_password,
  } = input;

  // 1. Validate required fields
  if (!company_name || !admin_email || !admin_password) {
    throw new Error("company_name, admin_email, and admin_password are required");
  }

  // 2. Check email not already taken
  const existingUser = await prisma.users.findFirst({
    where: { email: admin_email.toLowerCase().trim() },
  });

  if (existingUser) {
    throw new Error("email is already in use");
  }

  // 3. Check domain not taken (if provided)
  if (company_domain) {
    const existingDomain = await prisma.company.findUnique({
      where: { domain: company_domain },
    });

    if (existingDomain) {
      throw new Error("this company domain is already taken");
    }
  }

  // 4. Hash password
  const password_hash = await bcrypt.hash(admin_password, 10);

  // 5. Create company + admin + default leave policies in ONE transaction
  const result = await prisma.$transaction(async (tx) => {
    // 5a. Create the company
    const company = await tx.company.create({
      data: {
        name: company_name,
        domain: company_domain ?? null,
        status: "active",
      },
    });

    // 5b. Create the company admin user
    const admin = await tx.users.create({
      data: {
        email: admin_email.toLowerCase().trim(),
        password: password_hash,
        first_name: admin_first_name,
        last_name: admin_last_name,
        role: "company_admin",
        company_id: company.id,
        is_active: true,
      },
    });

    // 5c. Seed default leave policies for this company
    await tx.leavePolicy.createMany({
      data: [
        { company_id: company.id, leave_type: "annual", days_per_year: 21, carry_over: true, max_carry: 7 },
        { company_id: company.id, leave_type: "sick", days_per_year: 14, carry_over: false, max_carry: 0 },
        { company_id: company.id, leave_type: "emergency", days_per_year: 6, carry_over: false, max_carry: 0 },
        { company_id: company.id, leave_type: "maternity", days_per_year: 90, carry_over: false, max_carry: 0 },
        { company_id: company.id, leave_type: "unpaid", days_per_year: 30, carry_over: false, max_carry: 0 },
      ],
    });

    return { company, admin };
  });

  // 6. Return (no password in response)
  return {
    company: {
      id: result.company.id,
      name: result.company.name,
      domain: result.company.domain,
      status: result.company.status,
      created_at: result.company.created_at,
    },
    admin: {
      id: result.admin.id,
      email: result.admin.email,
      first_name: result.admin.first_name,
      last_name: result.admin.last_name,
      role: result.admin.role,
    },
  };
};

// Update company
export const updateCompanyService = async (id: string, data: Partial<CreateCompanyInput>) => {
  return await prisma.company.update({
    where: { id },
    data: {
      name: data.company_name,
      domain: data.company_domain
    }
  })
}

// Delete company
export const deleteCompanyService = async (id: string) => {
  return await prisma.company.update({
    where: { id },
    data: {
      status: "deleted",
    }
  })
}







//  listCompaniesService 
// Super Admin: get all companies with user counts
export const listCompaniesService = async (status?: string) => {
  const companies = await prisma.company.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { created_at: "desc" },
    include: {
      _count: {
        select: { users: true, departments: true },
      },
    },
  });

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    domain: c.domain,
    status: c.status,
    user_count: c._count.users,
    dept_count: c._count.departments,
    created_at: c.created_at,
  }));
};

//  getStatsService 
// Super Admin dashboard stats
export const getStatsService = async (searchQuery?: string) => {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  // 
  const companyFilter: Prisma.CompanyWhereInput = searchQuery
    ? { name: { contains: searchQuery, mode: 'insensitive' } }
    : {};

  // Run all DB queries in parallel
  const [
    totalCompanies,
    activeCompanies,
    suspendedCompanies,
    totalUsers,
    activeUsers,
    newCompaniesThisMonth,
    newUsersThisMonth,
    recentCompanies,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { status: "active" } }),
    prisma.company.count({ where: { status: "suspended" } }),
    prisma.users.count({ where: { role: { not: "super_admin" } } }),
    prisma.users.count({ where: { is_active: true, role: { not: "super_admin" } } }),
    prisma.company.count({ where: { created_at: { gte: startOfMonth } } }),
    prisma.users.count({
      where: {
        role: { not: "super_admin" },
        created_at: { gte: startOfMonth },
      },
    }),
    prisma.company.findMany({
      where: companyFilter,
      take: 5,
      orderBy: { created_at: "desc" },
      include: { _count: { select: { users: true } } },
    }),
  ]);

  return {
    companies: {
      total: totalCompanies,
      active: activeCompanies,
      suspended: suspendedCompanies,
      new_this_month: newCompaniesThisMonth,
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      new_this_month: newUsersThisMonth,
    },
    recent_companies: recentCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      user_count: c._count.users,
      created_at: c.created_at,
    })),
  };
};

//  toggleCompanyStatusService 
export const toggleCompanyStatusService = async (
  id: string,
  status: "active" | "suspended"
) => {
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) throw new Error("the company is not found");

  const updated = await prisma.company.update({
    where: { id },
    data: { status },
  });

  return {
    id: updated.id,
    name: updated.name,
    status: updated.status,
  };
};
