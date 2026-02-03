import express from "express";
import { getIndustries } from "./industries.controller.js";

const router = express.Router();

/**
 * GET /api/industries
 */
router.get("/", getIndustries);

export default router;
