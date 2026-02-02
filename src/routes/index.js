import { Router } from "express";
import blogRoutes from "../modules/blogs/blogs.routes.js";
import reportRoutes from "../modules/reports/reports.routes.js";

const router = Router();

router.use("/blogs", blogRoutes);
router.use("/reports", reportRoutes);

export default router;
