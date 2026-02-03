import { Router } from "express";
import blogRoutes from "../modules/blogs/blogs.routes.js";
import reportRoutes from "../modules/reports/reports.routes.js";
import industryRoutes from "../modules/industry/industries.routes.js";

const router = Router();

router.use("/blogs", blogRoutes);
router.use("/reports", reportRoutes);
router.use("/industries", industryRoutes);

export default router;
