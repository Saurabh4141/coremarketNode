import { fetchIndustries } from "./industries.service.js";
import { writeLog } from "../../utils/writeLog.js";

export const getIndustries = async (req, res) => {
  try {
    const industries = await fetchIndustries();

    res.json({
      success: true,
      data: industries,
    });
  } catch (error) {
    writeLog("ERROR", "Industries API failed", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to fetch industries",
    });
  }
};
