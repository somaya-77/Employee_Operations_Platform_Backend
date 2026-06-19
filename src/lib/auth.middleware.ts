
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request to carry user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId:    string;
        role:      string;
        companyId: string | null;
      };
    }
  }
}

// ── verifyToken ───────────────────────────────────────
// Authorization header
// export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
//   const authHeader = req.headers.authorization;
// console.log("AUTH HEADER:", req.headers.authorization);
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Please log in first" });
//   }

//   const token  = authHeader.split(" ")[1];
//   const secret = process.env.JWT_SECRET;

//   if (!secret) {
//     return res.status(500).json({ message: "JWT_SECRET is not defined" });
//   }

//   try {
//     const decoded = jwt.verify(token, secret) as {
//       userId:    string;
//       role:      string;
//       companyId: string | null;
//     };

//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Your session has expired — please log in again" });
//   }
// };

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  console.log("========== VERIFY TOKEN ==========");
  console.log("AUTH HEADER:", req.headers.authorization);

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("NO AUTH HEADER");

    return res.status(401).json({
      message: "Please log in first"
    });
  }

  const token = authHeader.split(" ")[1];

  console.log("TOKEN:", token);

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    console.log("JWT VERIFIED:", decoded);

    req.user = decoded as any;

    next();

  } catch (error) {

    console.log("JWT ERROR:", error);

    return res.status(401).json({
      message: "Your session has expired — please log in again"
    });
  }
};

// ── requireRole ───────────────────────────────────────
// usage: router.post("/", verifyToken, requireRole("super_admin"), handler)
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `This action requires the following roles: ${roles.join(" or ")}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};
