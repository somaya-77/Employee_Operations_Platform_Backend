
import express from 'express';
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import superAdminRoutes from "./routes/super-admin.routes.js"
import employeeRoutes from "./routes/company-admin/employees.js"
import departmentRoutes from "./routes/company-admin/departments.js"


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

// Super-admin routes - employees
app.use("/api/company-admin/employees", employeeRoutes);

// Super-admin routes - departments
app.use("/api/company-admin/department", departmentRoutes);

export default app;