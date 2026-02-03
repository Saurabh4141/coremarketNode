import { Router } from "express";
import { getHomeReports, getReports } from "./reports.controller.js";

const router = Router();

router.get("/getHomeReports", getHomeReports);
router.get("/", getReports);

export default router;
