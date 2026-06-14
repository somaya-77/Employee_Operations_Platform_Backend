
import express from 'express';
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";


// Create an instance of the Express application
const app = express();

app.use(express.json());


app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.originalUrl);
  next();
});

// Auth routes
app.use("/api/auth", authRoutes);
// Company routes
app.use("/api/companies", companyRoutes);

export default app;