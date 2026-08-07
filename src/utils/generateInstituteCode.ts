import { Institute } from "../models/institute/institute.model";

/**
 * Generates a unique 8-character uppercase Institute Code (e.g. "TP849201" or "INST8492")
 */
export const generateInstituteCode = async (): Promise<string> => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing 0, O, 1, I
  let unique = false;
  let code = "";

  while (!unique) {
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `TP${randomPart}`; // 2 chars ("TP") + 6 random chars = Exactly 8 characters!

    const existing = await Institute.findOne({ code });
    if (!existing) {
      unique = true;
    }
  }

  return code;
};
