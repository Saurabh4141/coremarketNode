import {
  fetchLatestBlogs,
  fetchBlogs,
  fetchBlogBySlug,
  fetchPopularBlogs,
  fetchBlogCategories,
  fetchRelatedBlogs
} from "./blogs.service.js";
import { writeLog } from "../../utils/writeLog.js";

export const getLatestBlogs = async (req, res) => {
  try {
    const blogs = await fetchLatestBlogs(4);

    writeLog("INFO", "Latest blogs API called");

    res.json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    writeLog("ERROR", "Failed to fetch latest blogs", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
};

export const getBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;

    const safeLimit = Math.min(Number(limit), 50);
    const offset = (Number(page) - 1) * safeLimit;

    const blogs = await fetchBlogs({
      limit: safeLimit,
      offset,
      category,
    });

    res.json({
      success: true,
      data: blogs,
      pagination: {
        page: Number(page),
        limit: safeLimit,
      },
    });
  } catch (error) {
    writeLog("ERROR", "Blogs API failed", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
};

export const getBlogDetail = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await fetchBlogBySlug(slug);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    writeLog("ERROR", "Blog detail API failed", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
    });
  }
};

export const getPopularBlogs = async (req, res) => {
  try {
    const blogs = await fetchPopularBlogs(3);

    res.json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular blogs",
    });
  }
};

export const getBlogCategories = async (req, res) => {
  try {
    const categories = await fetchBlogCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog categories",
    });
  }
};

export const getRelatedBlogs = async (req, res) => {
  try {
    const { category, slug } = req.query;

    if (!category || !slug) {
      return res.status(400).json({
        success: false,
        message: "category and slug are required",
      });
    }

    const relatedBlogs = await fetchRelatedBlogs({
      categorySlug: category,
      excludeSlug: slug,
      limit: 3,
    });

    res.json({
      success: true,
      data: relatedBlogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch related blogs",
    });
  }
};
