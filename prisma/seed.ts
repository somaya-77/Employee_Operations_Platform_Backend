import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    // 1. Create Super Admin user
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "super@empops.io";
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2026!";

    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    await prisma.users.create({
        data: {
            email: superAdminEmail,
            password: hashedPassword,
            first_name: "Super",
            last_name: "Admin",
            role: "super_admin"
        }
    });

    // 2. Companies (active, suspended, trial) 
    const activeCompany = await prisma.company.create({
        data: { name: "Acme Corp", domain: "acme.com", status: "active" }
    });

    const suspendedCompany1 = await prisma.company.create({
        data: { name: "Globex Inc", domain: "globex.com", status: "suspended" },
    });

    const suspendedCompany2 = await prisma.company.create({
        data: { name: "Initech", domain: "initech.com", status: "suspended" },
    });

    const trialCompany = await prisma.company.create({
        data: { name: "Hooli", domain: "hooli.com", status: "trial" },
    });

    // 3. Company admin for active company
    const adminPassword = await bcrypt.hash("Admin@2026!", 10);

    const companyAdmin = await prisma.users.create({
        data: {
            email: "admin@acme.com",
            password: adminPassword,
            first_name: "John",
            last_name: "Doe",
            role: "company_admin",
            company_id: activeCompany.id,
            is_active: true,
        },
    });

    // 4. Create a Department for Active Company
    const engineeringDept = await prisma.department.create({
        data: {
            name: "Engineering",
            company_id: activeCompany.id,
            manager_id: companyAdmin.id,
        },
    });

    const salesDept = await prisma.department.create({
        data: {
            name: "Sales",
            company_id: activeCompany.id,
        },
    });

    // 5. Default leave policies for active company
    await prisma.leavePolicy.createMany({
        data: [
            { company_id: activeCompany.id, leave_type: "annual", days_per_year: 21, carry_over: true, max_carry: 7 },
            { company_id: activeCompany.id, leave_type: "sick", days_per_year: 14, carry_over: false, max_carry: 0 },
            { company_id: activeCompany.id, leave_type: "emergency", days_per_year: 6, carry_over: false, max_carry: 0 },
            { company_id: activeCompany.id, leave_type: "maternity", days_per_year: 90, carry_over: false, max_carry: 0 },
            { company_id: activeCompany.id, leave_type: "unpaid", days_per_year: 30, carry_over: false, max_carry: 0 },
        ],
    });

    // 6. Active employees (Recent employees for dashboard)
    const employeePassword1 = await bcrypt.hash("Employee1@2026!", 10);
    const employeePassword2 = await bcrypt.hash("Employee2@2026!", 10);

    const employee1 = await prisma.users.create({
        data: {
            email: "sara@acme.com",
            password: employeePassword1,
            first_name: "Sara",
            last_name: "Ahmed",
            role: "employee",
            company_id: activeCompany.id,
            department_id: engineeringDept.id,
            manager_id: companyAdmin.id,
            is_active: true,
            hire_date: new Date("2026-06-01"),
        },
    });

    const employee2 = await prisma.users.create({
        data: {
            email: "omar@acme.com", // تم تغيير الإيميل لتجنب التكرار
            password: employeePassword2,
            first_name: "Omar",
            last_name: "Khaled",
            role: "employee",
            company_id: activeCompany.id,
            department_id: salesDept.id,
            manager_id: companyAdmin.id,
            is_active: true,
            hire_date: new Date("2026-06-15"),
        },
    });

    // 7. Inactive (deactivated) users => triggers warning alerts
    await prisma.users.createMany({
        data: [
            {
                email: "mike@acme.com",
                password: employeePassword1,
                first_name: "Mike",
                last_name: "Johnson",
                role: "employee",
                company_id: activeCompany.id,
                is_active: false,
            },
            {
                email: "lisa@globex.com",
                password: employeePassword2,
                first_name: "Lisa",
                last_name: "Smith",
                role: "employee",
                company_id: suspendedCompany1.id,
                is_active: false,
            },
            {
                email: "tom@initech.com",
                password: employeePassword2,
                first_name: "Tom",
                last_name: "Brown",
                role: "manager",
                company_id: suspendedCompany2.id,
                is_active: false,
            },
        ],
    });

    // 8. Pending leave requests => triggers warning alert
    await prisma.leaveRequest.createMany({
        data: [
            {
                employee_id: employee1.id,
                leave_type: "annual",
                start_date: new Date("2026-07-01"),
                end_date: new Date("2026-07-05"),
                days_count: 5,
                status: "pending",
                reason: "Family vacation",
            },
            {
                employee_id: employee2.id,
                leave_type: "sick",
                start_date: new Date("2026-06-20"),
                end_date: new Date("2026-06-21"),
                days_count: 2,
                status: "pending",
                reason: "Flu",
            },
            {
                employee_id: employee1.id,
                leave_type: "emergency",
                start_date: new Date("2026-06-25"),
                end_date: new Date("2026-06-25"),
                days_count: 1,
                status: "approved",
                reason: "Family emergency",
                approved_by: companyAdmin.id,
            },
        ],
    });

    // 9. Attendance Logs for active employees (Today / Recent)
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    await prisma.attendanceLog.createMany({
        data: [
            {
                user_id: employee1.id,
                date: todayDate,
                check_in: new Date(todayDate.getTime() + 8 * 3600 * 1000),
                check_out: new Date(todayDate.getTime() + 16 * 3600 * 1000), 
                status: "present",
                is_late: false,
            },
            {
                user_id: employee2.id,
                date: todayDate,
                check_in: new Date(todayDate.getTime() + 9.5 * 3600 * 1000), 
                check_out: null,
                status: "present",
                is_late: true,
            },
        ],
        skipDuplicates: true,
    });

    // 10. Leave Balances for active employees
    await prisma.leaveBalance.createMany({
        data: [
            { user_id: employee1.id, leave_type: "annual", year: 2026, total_days: 21, used_days: 5 },
            { user_id: employee1.id, leave_type: "sick", year: 2026, total_days: 14, used_days: 0 },
            { user_id: employee2.id, leave_type: "annual", year: 2026, total_days: 21, used_days: 0 },
            { user_id: employee2.id, leave_type: "sick", year: 2026, total_days: 14, used_days: 2 },
        ],
        skipDuplicates: true,
    });

    
    console.log("Seed completed successfully.");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(() => prisma.$disconnect());

