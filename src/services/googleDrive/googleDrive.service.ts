import { google } from "googleapis";
import { Readable } from "stream";
import { GoogleDriveToken, IGoogleDriveToken } from "../../models/googleDriveToken/googleDriveToken.model";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/materials/google/callback";
const STUDENT_REDIRECT_URI = process.env.GOOGLE_STUDENT_REDIRECT_URI || "http://localhost:5000/api/homework/student/drive-callback";

function createOAuth2Client(redirectUri?: string) {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, redirectUri || REDIRECT_URI);
}

export const googleDriveService = {
  /**
   * Generate Google OAuth2 authorization URL
   */
  getAuthUrl: (state: string): string => {
    const oauth2Client = createOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      state,
    });
  },

  /**
   * Exchange authorization code for tokens, create public folder, save everything
   */
  handleCallback: async (code: string, instituteId: string, userId: string) => {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get connected user email
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const connectedEmail = userInfo.data.email || "";

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Create "TuitionPro Study Materials" folder in teacher's Drive
    const folderRes = await drive.files.create({
      requestBody: {
        name: "TuitionPro Study Materials",
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id, webViewLink",
    });

    const folderId = folderRes.data.id!;
    const folderUrl = folderRes.data.webViewLink || `https://drive.google.com/drive/folders/${folderId}`;

    // Make folder publicly accessible (anyone with link can view)
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Save (upsert) tokens & folder info for this institute teacher
    await GoogleDriveToken.findOneAndUpdate(
      { instituteId, userId },
      {
        instituteId,
        userId,
        userType: "institute",
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiryDate: tokens.expiry_date || Date.now() + 3600 * 1000,
        folderId,
        folderUrl,
        connectedEmail,
      },
      { upsert: true, new: true }
    );

    return { folderId, folderUrl, connectedEmail };
  },

  /**
   * Upload a file buffer to teacher's Google Drive folder
   */
  uploadFile: async (
    tokenDoc: IGoogleDriveToken,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    instituteId: string
  ) => {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: tokenDoc.accessToken,
      refresh_token: tokenDoc.refreshToken,
      expiry_date: tokenDoc.expiryDate,
    });

    // Auto-save refreshed tokens
    oauth2Client.on("tokens", async (newTokens) => {
      if (newTokens.access_token) {
        await GoogleDriveToken.findOneAndUpdate(
          { instituteId },
          {
            accessToken: newTokens.access_token,
            ...(newTokens.refresh_token ? { refreshToken: newTokens.refresh_token } : {}),
            ...(newTokens.expiry_date ? { expiryDate: newTokens.expiry_date } : {}),
          }
        );
      }
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Upload file to TuitionPro Materials folder
    const uploadRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [tokenDoc.folderId],
      },
      media: {
        mimeType,
        body: Readable.from(fileBuffer),
      },
      fields: "id, webViewLink, webContentLink, size",
    });

    const fileId = uploadRes.data.id!;

    // Make file publicly accessible (anyone with link can view and download)
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const viewUrl = uploadRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return { fileId, viewUrl, downloadUrl };
  },

  /**
   * Delete a file from Google Drive
   */
  deleteFile: async (tokenDoc: IGoogleDriveToken, fileId: string, instituteId: string) => {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: tokenDoc.accessToken,
      refresh_token: tokenDoc.refreshToken,
      expiry_date: tokenDoc.expiryDate,
    });

    oauth2Client.on("tokens", async (newTokens) => {
      if (newTokens.access_token) {
        await GoogleDriveToken.findOneAndUpdate({ instituteId }, { accessToken: newTokens.access_token });
      }
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    await drive.files.delete({ fileId });
  },

  // ─────────────────────────────────────────────────────────────
  // STUDENT-SPECIFIC METHODS
  // ─────────────────────────────────────────────────────────────

  /**
   * Generate Google OAuth2 URL for a STUDENT (different redirect URI)
   */
  getStudentAuthUrl: (state: string): string => {
    const oauth2Client = createOAuth2Client(STUDENT_REDIRECT_URI);
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      state,
    });
  },

  /**
   * Handle OAuth callback for a STUDENT — creates "TuitionPro Homework Submissions" folder
   */
  handleStudentCallback: async (code: string, instituteId: string, userId: string, studentId: string) => {
    const oauth2Client = createOAuth2Client(STUDENT_REDIRECT_URI);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const connectedEmail = userInfo.data.email || "";

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Create "TuitionPro Homework Submissions" folder in student's Drive
    const folderRes = await drive.files.create({
      requestBody: {
        name: "TuitionPro Homework Submissions",
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id, webViewLink",
    });

    const folderId = folderRes.data.id!;
    const folderUrl = folderRes.data.webViewLink || `https://drive.google.com/drive/folders/${folderId}`;

    // Make folder publicly accessible (teacher can view submissions)
    await drive.permissions.create({
      fileId: folderId,
      requestBody: { role: "reader", type: "anyone" },
    });

    // Upsert token keyed by (instituteId + userId)
    await GoogleDriveToken.findOneAndUpdate(
      { instituteId, userId },
      {
        instituteId,
        userId,
        userType: "student",
        studentId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiryDate: tokens.expiry_date || Date.now() + 3600 * 1000,
        folderId,
        folderUrl,
        connectedEmail,
      },
      { upsert: true, new: true }
    );

    return { folderId, folderUrl, connectedEmail };
  },

  /**
   * Upload to Drive using a specific userId's token (for student submissions)
   */
  uploadFileByUserId: async (
    instituteId: string,
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ) => {
    const tokenDoc = await GoogleDriveToken.findOne({ instituteId, userId, userType: "student" });
    if (!tokenDoc) throw new Error("Student Google Drive not connected.");

    const oauth2Client = createOAuth2Client(STUDENT_REDIRECT_URI);
    oauth2Client.setCredentials({
      access_token: tokenDoc.accessToken,
      refresh_token: tokenDoc.refreshToken,
      expiry_date: tokenDoc.expiryDate,
    });

    oauth2Client.on("tokens", async (newTokens) => {
      if (newTokens.access_token) {
        await GoogleDriveToken.findOneAndUpdate(
          { instituteId, userId },
          {
            accessToken: newTokens.access_token,
            ...(newTokens.refresh_token ? { refreshToken: newTokens.refresh_token } : {}),
            ...(newTokens.expiry_date ? { expiryDate: newTokens.expiry_date } : {}),
          }
        );
      }
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const uploadRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [tokenDoc.folderId],
      },
      media: {
        mimeType,
        body: Readable.from(fileBuffer),
      },
      fields: "id, webViewLink, webContentLink",
    });

    const fileId = uploadRes.data.id!;

    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    const viewUrl = uploadRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return { fileId, viewUrl, downloadUrl };
  },
};

