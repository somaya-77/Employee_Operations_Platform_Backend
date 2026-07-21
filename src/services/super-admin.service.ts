import { NotificationChannel, NotificationType, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { DEFAULT_SETTINGS, endOfLastMonth, lastOfMonth, now, startOfMonth } from "../constance/index.js";
import prisma from "../lib/prisma.js";


// 1. PLATFORM STATISTICS
export const getPlatformStatsService = async () => {
    const [
        // Companies
        totalCompanies, activeCompanies, suspendedCompanies, trialCompanies, newCompaniesThisMonth, newCompaniesLastMonth,

        // Users
        totalUsers, activeUsers, inactiveUsers, newUsersThisMonth, newUsersLastMonth,

        // Attendance today
        attendanceToday,

        // Leave requests
        pendingLeaveRequests,

        // Growth Chart - last 6 months
        companiesPerMonth,

    ] = await Promise.all([
        // Companies
        prisma.company.count(),
        prisma.company.count({ where: { status: "active" } }),
        prisma.company.count({ where: { status: "suspended" } }),
        prisma.company.count({ where: { status: "trial" } }),

        prisma.company.count({ where: { created_at: { gte: startOfMonth } } }),
        prisma.company.count({ where: { created_at: { gte: lastOfMonth, lte: endOfLastMonth } } }),

        // Users
        prisma.users.count({ where: { role: { not: "super_admin" } } }),
        prisma.users.count({ where: { is_active: true, role: { not: "super_admin" } } }),
        prisma.users.count({ where: { role: { not: "super_admin" }, created_at: { gte: startOfMonth } } }),
        prisma.users.count({ where: { role: { not: "super_admin" }, created_at: { gte: lastOfMonth, lte: endOfLastMonth } } }),
        prisma.attendanceLog.count({
            where: { date: { gte: new Date(now.toDateString()) } },
        }),

        // Attendance today
        prisma.attendanceLog.count({
            where: { date: { gte: new Date(now.toDateString()) } },
        }),

        // Leave requests
        prisma.leaveRequest.count({ where: { status: "pending" } }),

        // Last 6 months company growth
        prisma.$queryRaw<{ month: string; count: bigint }[]>`
            SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
            FROM companies
            WHERE created_at >= NOW() - INTERVAL '6 months'
            GROUP BY month
            ORDER BY month ASC
        `,
    ]);


    const companiesGrowth = Number(newCompaniesThisMonth) - Number(newCompaniesLastMonth);
    const usersGrowth = Number(newUsersThisMonth) - Number(newUsersLastMonth);

    return {
        // Companies
        companies: {
            total: totalCompanies,
            active: activeCompanies,
            suspended: suspendedCompanies,
            trial: trialCompanies,
            new_this_month: newCompaniesThisMonth,
            growth: companiesGrowth >= 0 ? `+${companiesGrowth}` : `${companiesGrowth}`,
            growth_positive: companiesGrowth >= 0,
        },
        // Users
        users: {
            total: totalUsers,
            active: activeUsers,
            inactive: inactiveUsers,
            new_this_month: newUsersThisMonth,
            growth: usersGrowth >= 0 ? `+${usersGrowth}` : `${usersGrowth}`,
            growth_positive: usersGrowth >= 0,
            activity_rate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        },
        operations: {
            attendance_today: attendanceToday,
            pending_leave_requests: pendingLeaveRequests,
        },
        chart: companiesPerMonth.map((item) => ({
            month: item.month,
            count: Number(item.count),
        })),
    }
};

//* ******************************************************************* */
// 2. SUBSCRIPTIONS
// GET SUBSCRIPTIONS
export const getSubscriptionsService = async (status?: SubscriptionStatus) => {
    const where = status ? { status } : undefined;

    const [subscriptions, counts] = await Promise.all([
        prisma.subscription.findMany({
            where,
            orderBy: { created_at: "desc" },
            include: {
                company: { select: { id: true, name: true, logo_url: true } }
            }
        }),
        prisma.subscription.groupBy({
            by: ["status"],
            _count: { id: true },
        }),
    ]);

    const statusCounts = counts.reduce((acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
    }, {} as Record<string, number>);

    return {
        subscriptions,
        counts: statusCounts,
    };

};

// CREATE SUBSCRIPTION
export const createSubscriptionService = async (data: {
    company_id: string;
    plan: SubscriptionPlan;
    expires_at?: string;
    max_users?: number;
    price_monthly?: number;
}) => {
    const existing = await prisma.subscription.findUnique({ where: { company_id: data.company_id } });
    if (existing) throw new Error("Subscription already exists for this company");

    const PLAN_DEFAULTS = {
        basic: { price_monthly: 99, max_users: 25 },
        premium: { price_monthly: 299, max_users: 100 },
        enterprise: { price_monthly: 799, max_users: 9999 },
    };

    const planDefaults = PLAN_DEFAULTS[data.plan];

    return prisma.subscription.create({
        data: {
            company_id: data.company_id,
            plan: data.plan,
            status: "active",
            price_monthly: data.price_monthly ?? planDefaults.price_monthly,
            max_users: data.max_users ?? planDefaults.max_users,
            expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
        },
        include: { company: { select: { name: true } } },
    })
}

// UPDATE SUBSCRIPTION
export const updateSubscriptionService = async (subscriptionId: string, data: {
    plan?: SubscriptionPlan;
    status?: SubscriptionStatus;
    expires_at?: string;
    max_users?: number;
    price_monthly?: number;
}) => {
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) {
        throw new Error("Subscription not found");
    }

    return prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
            ...data,
            expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
        },
        include: {
            company: { select: { name: true } }
        }
    });
};

//* ******************************************************************* */
// 3. NOTIFICATIONS
// GET NOTIFICATIONS
export const getNotificationsService = async () => {
    return prisma.notification.findMany({
        orderBy: { created_at: "desc" },
        take: 50,
    })
};

// CREATE NOTIFICATION
export const createNotificationService = async (data: {
    title: string;
    message: string;
    type: NotificationType;
    channel: NotificationChannel;
    target_role?: string;
    company_id?: string;
}) => {
    if (!data.title || !data.message) throw new Error("Title and message are required");
    // TODO: Implement notification creation logic
    return prisma.notification.create({
        data: {
            title: data.title,
            message: data.message,
            type: data.type ?? "info",
            channel: data.channel ?? "in_app",
            target_role: data.target_role ?? null,
            company_id: data.company_id ?? null,
            sent_at: new Date(),
        }
    })
};

// DELETE NOTIFICATION
export const deleteNotificationService = async (notificationId: string) => {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new Error("Notification not found");
    await prisma.notification.delete({ where: { id: notificationId } });
    return { deleted: true }
};

//* ******************************************************************* */
// 4. PLATFORM SETTINGS
// GET PLATFORM SETTINGS
export const getPlatformSettingsService = async () => {
    // Seed defaults if empty
    const count = await prisma.platformSetting.count();

    if (count === 0) {
        await prisma.platformSetting.createMany({
            data: Object.entries(DEFAULT_SETTINGS).map(([key, { value, description }]) => ({
                key,
                value,
                description
            })),
            skipDuplicates: true,
        });
    }

    const settings = await prisma.platformSetting.findMany({
        orderBy: { key: "asc" }
    });

    // Return as key-value object + array
    const asObj = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);

    return {settings, asObj};
};

export const updateSettingService = async (key: string, value: string) => {
    return prisma.platformSetting.upsert({
        where:  { key },
        update: { value },
        create: { key, value, description: DEFAULT_SETTINGS[key]?.description },
    });
};

export const updateSettingsBulkService = async (
    updates: { key: string; value: string }[]
) => {
    await Promise.all(
        updates.map(({ key, value }) =>
            prisma.platformSetting.upsert({
                where:  { key },
                update: { value },
                create: { key, value },
            })
        )
    );
    return { updated: updates.length };
};
