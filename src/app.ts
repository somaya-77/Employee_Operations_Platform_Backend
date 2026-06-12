
import express from 'express';
import authRoutes from "./routes/auth.routes.js";


// Create an instance of the Express application
const app = express();

app.use(express.json());


app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.originalUrl);
  next();
});

app.use("/api/auth", authRoutes);
export default app;