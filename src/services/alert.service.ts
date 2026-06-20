import prisma from "../lib/prisma.js";

export const getAlertsService = async () => {
    // 
    const [suspendedCompanies, inactiveUsers, pendingLeaves] = await Promise.all([
        prisma.company.findMany({
            where: { status: "suspended" },
            select: { id: true, name: true, updated_at: true },
        }),
        prisma.users.findMany({
            where: { is_active: false, role: { not: "super_admin" } },
            select: { id: true, first_name: true, last_name: true, company: { select: { name: true } }, updated_at: true },
            take: 5,
        }),
        prisma.leaveRequest.count({ where: { status: "pending" } }),
    ]);

    const alerts = [
        ...suspendedCompanies.map((c) => ({
            id: c.id,
            type: "error" as const,
            title: `Company suspended: ${c.name}`,
            message: "This company's account has been suspended and cannot access the platform.",

            created_at: c.updated_at,
        })),
        ...inactiveUsers.map((u) => ({
            id: u.id,
            type: "warning" as const,
            title: `Inactive user: ${u.first_name} ${u.last_name}`,
            subtitle: u.company?.name ?? "",
            message: u.company?.name
                ? `This user from ${u.company.name} has been deactivated.`
                : "This user has been deactivated.",
            created_at: u.updated_at,
        })),
        ...(pendingLeaves > 0
            ? [{
                id: "pending-leaves",
                type: "warning" as const,
                title: `${pendingLeaves} leave request${pendingLeaves > 1 ? "s" : ""} pending approval`,
                message: "These leave requests are awaiting review and approval.",

                created_at: new Date(),
            }]
            : []),
    ].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return { alerts };
};