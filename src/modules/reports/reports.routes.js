import { Router } from "express";
import { getReports } from "./reports.controller.js";

const router = Router();

router.get("/", getReports);

export default router;
