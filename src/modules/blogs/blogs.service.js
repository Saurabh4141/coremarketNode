import { mainDB } from "../../config/db.js";
import { writeLog } from "../../utils/writeLog.js";

export const fetchLatestBlogs = async (limit = 4) => {
  try {
    // MariaDB-safe LIMIT handling
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 4;

    const [rows] = await mainDB.query(
      `
        SELECT 
          bm.id,
          bm.title,
          bm.slug,
          bm.category,
          bm.author_name AS author,
          bm.excerpt,
          bm.publish_date AS date,
          bm.read_time AS readTime,
          bm.featured_image AS image,
          bm.created_at,
          CASE 
            WHEN bm.id = (
              SELECT id 
              FROM blog_master 
              ORDER BY created_at DESC 
              LIMIT 1
            )
            THEN TRUE
            ELSE FALSE
          END AS featured
        FROM blog_master bm
        ORDER BY bm.created_at DESC
        LIMIT ${safeLimit}
        `,
    );

    writeLog("INFO", `Latest ${safeLimit} blogs fetched`);

    return rows;
  } catch (error) {
    writeLog("ERROR", "Failed to fetch latest blogs", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};

/**
 * Fetch blog list
 */
export const fetchBlogs = async ({
  limit = 10,
  offset = 0,
  category = null,
} = {}) => {
  try {
    let sql = `
      SELECT
        id,
        title,
        slug,
        category,
        author_name,
        publish_date,
        read_time,
        featured_image,
        excerpt,
        isFeatured
      FROM blog_master
      WHERE status = ?
    `;

    const params = ["published"];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    sql += `
      ORDER BY
        CASE
          WHEN isFeatured = 1 THEN 0
          ELSE 1
        END,
        publish_date DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));

    const [rows] = await mainDB.execute(sql, params);

    writeLog("INFO", "Blogs fetched successfully", {
      limit,
      offset,
      category,
    });

    return rows.map((row) => ({
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      category: row.category,
      author: row.author_name,
      date: formatDate(row.publish_date),
      readTime: row.read_time,
      image: row.featured_image,
      featured: Boolean(row.isFeatured),
    }));
  } catch (error) {
    writeLog("ERROR", "Failed to fetch blogs", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};

/**
 * Fetch blog detail by slug
 */
export const fetchBlogBySlug = async (slug) => {
  try {
    /* ================= BLOG DETAIL ================= */

    const blogSql = `
      SELECT
        id,
        title,
        slug,
        category,
        author_name,
        author_role,
        author_avatar,
        author_bio,
        publish_date,
        read_time,
        featured_image,
        excerpt,
        introduction,
        sections,
        key_takeaways,
        quote,
        tags
      FROM blog_master
      WHERE slug = ?
        AND status = 'published'
      LIMIT 1
    `;

    const [rows] = await mainDB.execute(blogSql, [slug]);

    if (!rows.length) {
      return null;
    }

    const blog = rows[0];

    /* ================= RELATED POSTS ================= */

    const relatedSql = `
      SELECT
        title,
        slug,
        category,
        featured_image,
        excerpt
      FROM blog_master
      WHERE
        category = ?
        AND slug != ?
        AND status = 'published'
      ORDER BY publish_date DESC
      LIMIT 3
    `;

    const [relatedRows] = await mainDB.execute(relatedSql, [
      blog.category,
      slug,
    ]);

    writeLog("INFO", "Blog detail + related posts fetched", {
      slug,
      category: blog.category,
    });

    /* ================= RESPONSE FORMAT ================= */

    return {
      title: blog.title,
      category: blog.category,
      author: {
        name: blog.author_name,
        role: blog.author_role,
        avatar: blog.author_avatar,
        bio: blog.author_bio,
      },
      publishDate: formatLogDate(blog.publish_date),
      readTime: blog.read_time,
      image: blog.featured_image,
      tags: blog.tags
        ? blog.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
      content: {
        introduction: blog.introduction,
        sections: JSON.parse(blog.sections),
        keyTakeaways: blog.key_takeaways ? JSON.parse(blog.key_takeaways) : [],
        quote: blog.quote ? JSON.parse(blog.quote) : null,
      },
      relatedPosts: relatedRows.map((post) => ({
        title: post.title,
        slug: post.slug,
        category: post.category,
        image: post.featured_image,
        excerpt: post.excerpt,
      })),
    };
  } catch (error) {
    writeLog("ERROR", "Failed to fetch blog detail", {
      slug,
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};

/**
 * Fetch Popular Blogs
 */
export const fetchPopularBlogs = async (limit = 3) => {
  try {
    const sql = `
      SELECT
        title,
        slug
      FROM blog_master
      WHERE status = ?
      ORDER BY views DESC
      LIMIT ?
    `;

    const params = ["published", Number(limit)];

    const [rows] = await mainDB.execute(sql, params);

    writeLog("INFO", "Popular blogs fetched", { limit });

    return rows.map((row) => ({
      title: row.title,
      slug: row.slug,
    }));
  } catch (error) {
    writeLog("ERROR", "Failed to fetch popular blogs", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};

/**
 * Fetch Blogs Categories
 */
export const fetchBlogCategories = async () => {
  try {
    const sql = `
      SELECT DISTINCT
        category AS name,
        category_slug AS slug
      FROM blog_master
      WHERE
        status = ?
        AND category IS NOT NULL
        AND category_slug IS NOT NULL
      ORDER BY category ASC
    `;

    const [rows] = await mainDB.execute(sql, ["published"]);

    writeLog("INFO", "Blog categories fetched", {
      count: rows.length,
    });

    return rows;
  } catch (error) {
    writeLog("ERROR", "Failed to fetch blog categories", {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};

/**
 * Fetch related blogs by category
 */
export const fetchRelatedBlogs = async ({
  categorySlug,
  excludeSlug,
  limit = 3,
}) => {
  try {
    const sql = `
      SELECT
        title,
        slug,
        category,
        featured_image,
        excerpt
      FROM blog_master
      WHERE
        status = 'published'
        AND category_slug = ?
        AND slug != ?
      ORDER BY publish_date DESC
      LIMIT ?
    `;

    const params = [categorySlug, excludeSlug, Number(limit)];

    const [rows] = await mainDB.execute(sql, params);

    writeLog("INFO", "Related blogs fetched", {
      categorySlug,
      excludeSlug,
      count: rows.length,
    });

    return rows.map((row) => ({
      title: row.title,
      slug: row.slug,
      category: row.category,
      image: row.featured_image,
      excerpt: row.excerpt,
    }));
  } catch (error) {
    writeLog("ERROR", "Failed to fetch related blogs", {
      categorySlug,
      excludeSlug,
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    throw error;
  }
};

/* ================= HELPERS ================= */

const formatDate = (date) => {
  if (!date) return null;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatLogDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
};
