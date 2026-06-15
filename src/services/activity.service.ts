import prisma from "../lib/prisma.js";

export const getActivitiesService = async (limit = 10) => {
    const [leaveRequests, newUsers, newCompanies] = await Promise.all([
        prisma.leaveRequest.findMany({
            take: limit,
            orderBy: { created_at: "desc" },
            include: {
                employee: { select: { first_name: true, last_name: true, company: { select: { name: true } } } },
            },
        }),
        prisma.users.findMany({
            take: limit,
            orderBy: { created_at: "desc" },
            where: { role: { not: "super_admin" } },
            select: {
                id: true, first_name: true, last_name: true,
                role: true, created_at: true,
                company: { select: { name: true } },
            },
        }),
        prisma.company.findMany({
            take: limit,
            orderBy: { created_at: "desc" },
            select: { id: true, name: true, created_at: true, status: true },
        }),
    ]);

    // Merge + sort by date
    const activities = [
        ...leaveRequests.map((l) => ({
            id: l.id,
            type: "leave_request" as const,
            title: `${l.employee.first_name} ${l.employee.last_name} requested ${l.leave_type} leave`,
            subtitle: l.employee.company?.name ?? "",
            status: l.status,
            created_at: l.created_at,
        })),
        ...newUsers.map((u) => ({
            id: u.id,
            type: "new_user" as const,
            title: `New ${u.role} joined: ${u.first_name} ${u.last_name}`,
            subtitle: u.company?.name ?? "",
            status: "info" as const,
            created_at: u.created_at,
        })),
        ...newCompanies.map((c) => ({
            id: c.id,
            type: "new_company" as const,
            title: `New company registered: ${c.name}`,
            subtitle: c.status,
            status: "info" as const,
            created_at: c.created_at,
        })),
    ]
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        .slice(0, limit);

    return { activities };
};