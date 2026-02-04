import { Router } from "express";
import {
  getLatestBlogs,
  getBlogs,
  getBlogDetail,
  getPopularBlogs,
  getBlogCategories,
  getRelatedBlogs,
} from "./blogs.controller.js";

const router = Router();

router.get("/latest", getLatestBlogs);

/**
 * List blogs
 */
router.get("/", getBlogs);

/**
 * Popular blogs
 */
router.get("/popular", getPopularBlogs);

/**
 * Blog Categories
 */
router.get("/categories", getBlogCategories);

/**
 * Related Blog
 */
router.get("/related", getRelatedBlogs);

/**
 * Blog detail (Keep This at end)
 */
router.get("/:slug", getBlogDetail);

export default router;
