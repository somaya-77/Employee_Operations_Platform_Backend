
import express from 'express';
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import superAdminRoutes from "./routes/super-admin.routes.js"
import employeeRoutes from "./routes/company-admin/employees.routes.js"
import departmentRoutes from "./routes/company-admin/departments.routes.js"
import accountRoutes from "./routes/company-admin/account.routes.js"


// Create an instance of the Express application
const app = express();

app.use(express.json());

app.use((req, res, next) => { next() });

// Auth routes
app.use("/api/auth", authRoutes);
// Company routes
app.use("/api/companies", companyRoutes);
// Dashboard
app.use("/api/dashboard", dashboardRoutes);

// Super-admin routes
app.use("/api/super-admin", superAdminRoutes);


////////////////////////////  Company admin
// Company-admin routes - employees
app.use("/api/company-admin/employees", employeeRoutes);

// Company-admin routes - departments
app.use("/api/company-admin/department", departmentRoutes);

// Company-admin routes - departments
app.use("/api/company-admin/account", accountRoutes);

export default app;