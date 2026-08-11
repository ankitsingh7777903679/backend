import { Attendance } from "../../models/attendance/attendance.model";
import { Student } from "../../models/student/student.model";
import { Class } from "../../models/class/class.model";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";
import { MarkAttendanceInput } from "../../validations/attendance/attendance.validation";
import { Types } from "mongoose";

export const attendanceService = {
  getBatchAttendance: async (instituteId: string, batchId: string, dateStr: string) => {
    const filter: Record<string, unknown> = { instituteId, dateStr };
    if (batchId) {
      if (Types.ObjectId.isValid(batchId)) {
        filter.$or = [
          { batchId: new Types.ObjectId(batchId) },
          { batchName: batchId },
        ];
      } else {
        filter.batchName = batchId;
      }
    }
    const record = await Attendance.findOne(filter);
    return record;
  },

  getAllRecords: async (instituteId: string, query: { batchId?: string; dateStr?: string }) => {
    const filter: Record<string, unknown> = { instituteId };
    if (query.batchId) filter.batchId = query.batchId;
    if (query.dateStr) filter.dateStr = query.dateStr;

    const records = await Attendance.find(filter).sort({ dateStr: -1 });
    return records;
  },

  markAttendance: async (data: MarkAttendanceInput, instituteId: string, userId?: string, userName?: string) => {
    const totalPresent = data.records.filter((r) => r.status === "present").length;
    const totalAbsent = data.records.filter((r) => r.status === "absent").length;
    const totalLate = data.records.filter((r) => r.status === "late").length;
    const totalLeave = data.records.filter((r) => r.status === "leave").length;

    const date = new Date(data.dateStr);

    let resolvedBatchId: Types.ObjectId | undefined = Types.ObjectId.isValid(data.batchId)
      ? new Types.ObjectId(data.batchId)
      : undefined;

    if (!resolvedBatchId && data.batchName) {
      const clsDoc = await Class.findOne({ instituteId, name: data.batchName, status: { $ne: "deleted" } });
      if (clsDoc) {
        resolvedBatchId = clsDoc._id as Types.ObjectId;
      }
    }

const formattedRecords = await Promise.all(
      data.records.map(async (r) => {
        let studId: Types.ObjectId | undefined = Types.ObjectId.isValid(r.studentId)
          ? new Types.ObjectId(r.studentId)
          : undefined;

        if (studId) {
          // A submitted student ID must map to a real student of this institute —
          // otherwise a fabricated/stale ID would silently create orphaned rows.
          const knownStudent = await Student.exists({
            _id: studId,
            instituteId,
            status: { $ne: "deleted" },
          });
          if (!knownStudent) {
            throw new AppError(
              `Student not found for attendance record '${r.studentName || r.admissionNo}' (student ID does not match any enrolled student)`,
              400
            );
          }
        } else if (r.admissionNo || r.studentName) {
          const studentDoc = await Student.findOne({
            instituteId,
            status: { $ne: "deleted" },
            $or: [{ admissionNo: r.admissionNo }, { name: r.studentName }],
          });
          if (studentDoc) {
            studId = studentDoc._id as Types.ObjectId;
          }
        }

        if (!studId) {
          throw new AppError(`Student not found for attendance record '${r.studentName || r.admissionNo}'`, 400);
        }
        return {
          studentId: studId,
          studentName: r.studentName,
          admissionNo: r.admissionNo,
          status: r.status,
          remarks: r.remarks,
        };
      })
    );

    const safeUserId = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

    // Filter query for findOneAndUpdate
    const queryFilter: Record<string, unknown> = { instituteId, dateStr: data.dateStr };
    if (resolvedBatchId) {
      queryFilter.batchId = resolvedBatchId;
    } else {
      queryFilter.batchName = data.batchName;
    }

    // Update or Insert Attendance for that Batch & Date
    const attendance = await Attendance.findOneAndUpdate(
      queryFilter,
      {
        $set: {
          instituteId,
          batchId: resolvedBatchId,
          batchName: data.batchName,
          date,
          dateStr: data.dateStr,
          markedByUserId: safeUserId,
          markedByName: userName || "Admin Teacher",
          records: formattedRecords,
          totalPresent,
          totalAbsent,
          totalLate,
          totalLeave,
          whatsappAlertsSent: data.sendWhatsAppAlerts,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Mock WhatsApp trigger log for absent students
    if (data.sendWhatsAppAlerts && totalAbsent > 0) {
      logger.info(`[WhatsApp Cloud API Mock] Sent ${totalAbsent} absent alerts for batch ${data.batchName} on ${data.dateStr}`);
    }

    return attendance;
  },

  getStudentAttendanceHistory: async (instituteId: string, userId: string, userEmail?: string, userName?: string) => {
    let studentDoc = null;
    if (Types.ObjectId.isValid(userId)) {
      studentDoc = await Student.findOne({ instituteId, status: { $ne: "deleted" }, userId: new Types.ObjectId(userId) });
    }

    if (!studentDoc && (userEmail || userName)) {
      studentDoc = await Student.findOne({
        instituteId,
        status: { $ne: "deleted" },
        $or: [{ email: userEmail }, { name: userName }],
      });
    }

    const allBatchesAttendance = await Attendance.find({ instituteId }).sort({ dateStr: 1 });

    const studentRecords: {
      dateStr: string;
      batchName: string;
      status: "present" | "absent" | "late" | "leave";
      remarks?: string;
    }[] = [];

    for (const att of allBatchesAttendance) {
      if (Array.isArray(att.records)) {
        const found = att.records.find(
          (r) =>
            (studentDoc && r.studentId && r.studentId.toString() === studentDoc._id.toString()) ||
            (studentDoc && r.admissionNo && r.admissionNo === studentDoc.admissionNo) ||
            (studentDoc && r.studentName && r.studentName.toLowerCase() === studentDoc.name.toLowerCase()) ||
            (userName && r.studentName && r.studentName.toLowerCase() === userName.toLowerCase())
        );

        if (found) {
          studentRecords.push({
            dateStr: att.dateStr,
            batchName: att.batchName,
            status: found.status,
            remarks: found.remarks,
          });
        }
      }
    }

    return studentRecords;
  },
};
