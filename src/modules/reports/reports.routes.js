import { Router } from "express";
import {
  getHomeReports,
  getReports,
  getRelatedReports,
} from "./reports.controller.js";

const router = Router();

router.get("/", getReports);
router.get("/getHomeReports", getHomeReports);
router.get("/related", getRelatedReports);

export default router;
