import { Router } from "express";
import { getLatestBlogs } from "./blogs.controller.js";

const router = Router();

router.get("/latest", getLatestBlogs);

export default router;
