import { Notification, NotificationType } from "../../models/notification/notification.model";
import { Student } from "../../models/student/student.model";
import { Types } from "mongoose";

export const notificationService = {
  createNotification: async (data: {
    instituteId: string | Types.ObjectId;
    recipientUserId: string | Types.ObjectId;
    recipientStudentId?: string | Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      const instId = typeof data.instituteId === "string" ? new Types.ObjectId(data.instituteId) : data.instituteId;
      const recId = typeof data.recipientUserId === "string" ? new Types.ObjectId(data.recipientUserId) : data.recipientUserId;
      const studId = data.recipientStudentId
        ? typeof data.recipientStudentId === "string"
          ? new Types.ObjectId(data.recipientStudentId)
          : data.recipientStudentId
        : undefined;

      const notif = await Notification.create({
        instituteId: instId,
        recipientUserId: recId,
        recipientStudentId: studId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: data.metadata,
        isRead: false,
      });

      return notif;
    } catch {
      // Safe fallback - don't break parent flow if notification write fails
      return null;
    }
  },

  getUserNotifications: async (instituteId: string, userId: string, limit = 20) => {
    const instIdObj = new Types.ObjectId(instituteId);
    const userIdObj = new Types.ObjectId(userId);

    const notifications = await Notification.find({
      instituteId: instIdObj,
      recipientUserId: userIdObj,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      instituteId: instIdObj,
      recipientUserId: userIdObj,
      isRead: false,
    });

    return { notifications, unreadCount };
  },

  markAsRead: async (instituteId: string, userId: string, notificationId?: string) => {
    const instIdObj = new Types.ObjectId(instituteId);
    const userIdObj = new Types.ObjectId(userId);

    if (notificationId && Types.ObjectId.isValid(notificationId)) {
      await Notification.updateOne(
        { _id: new Types.ObjectId(notificationId), instituteId: instIdObj, recipientUserId: userIdObj },
        { $set: { isRead: true } }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { instituteId: instIdObj, recipientUserId: userIdObj, isRead: false },
        { $set: { isRead: true } }
      );
    }

    return { success: true };
  },

  deleteNotification: async (instituteId: string, userId: string, notificationId: string) => {
    if (!Types.ObjectId.isValid(notificationId)) return { success: false };
    await Notification.deleteOne({
      _id: new Types.ObjectId(notificationId),
      instituteId: new Types.ObjectId(instituteId),
      recipientUserId: new Types.ObjectId(userId),
    });
    return { success: true };
  },

  // Event Dispatcher 1: Student Welcome
  sendWelcomeNotification: async (
    instituteId: string | Types.ObjectId,
    studentId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    studentName: string
  ) => {
    return notificationService.createNotification({
      instituteId,
      recipientUserId: userId,
      recipientStudentId: studentId,
      type: "welcome",
      title: "🎉 Welcome to TuitionPro!",
      message: `Hello ${studentName}, your student learning account is active. Welcome aboard!`,
      link: "/student-dashboard",
    });
  },

  // Event Dispatcher 2: Batch Enrolled
  sendBatchEnrolledNotification: async (
    instituteId: string | Types.ObjectId,
    studentId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    studentName: string,
    batchName: string,
    timing?: string
  ) => {
    const timeText = timing ? ` (Timings: ${timing})` : "";
    return notificationService.createNotification({
      instituteId,
      recipientUserId: userId,
      recipientStudentId: studentId,
      type: "batch_enrolled",
      title: "📚 Enrolled in Class Batch",
      message: `You have been enrolled in batch ${batchName}${timeText}. Check your schedule!`,
      link: "/my-classes",
      metadata: { batchName, timing },
    });
  },

  // Event Dispatcher 3: Batch Changed
  sendBatchChangedNotification: async (
    instituteId: string | Types.ObjectId,
    studentId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    studentName: string,
    oldBatch: string,
    newBatch: string,
    newTiming?: string
  ) => {
    const timingMsg = newTiming ? ` New timings: ${newTiming}.` : "";
    return notificationService.createNotification({
      instituteId,
      recipientUserId: userId,
      recipientStudentId: studentId,
      type: "batch_changed",
      title: "🔄 Class Batch Updated",
      message: `Your batch has been transferred from ${oldBatch} to ${newBatch}.${timingMsg}`,
      link: "/my-classes",
      metadata: { oldBatch, newBatch, newTiming },
    });
  },

  // Event Dispatcher 4: Fee Payment Confirmation
  sendFeePaidNotification: async (
    instituteId: string | Types.ObjectId,
    studentId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    amount: number,
    receiptNo: string,
    month?: string
  ) => {
    const monthMsg = month ? ` for ${month}` : "";
    return notificationService.createNotification({
      instituteId,
      recipientUserId: userId,
      recipientStudentId: studentId,
      type: "fee_paid",
      title: "💰 Fee Payment Received!",
      message: `Payment of ₹${amount}${monthMsg} received successfully. Receipt #${receiptNo}.`,
      link: "/my-fees",
      metadata: { amount, receiptNo, month },
    });
  },

  // Event Dispatcher 5: Test Scheduled (Broadcasts to all students in a batch)
  sendTestScheduledNotification: async (
    instituteId: string | Types.ObjectId,
    batchName: string,
    examTitle: string,
    examDate: Date | string,
    startTime?: string,
    mode?: string
  ) => {
    try {
      const instIdObj = typeof instituteId === "string" ? new Types.ObjectId(instituteId) : instituteId;
      // Find all students in this batch
      const students = await Student.find({
        instituteId: instIdObj,
        status: { $ne: "deleted" },
        $or: [{ batchName }, { className: batchName }],
      });

      const formattedDate = new Date(examDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      const modeText = mode === "online_mcq" ? "⚡ Live Online MCQ" : "📝 Offline Paper Test";
      const timeText = startTime ? ` at ${startTime}` : "";

      for (const st of students) {
        if (st.userId) {
          await notificationService.createNotification({
            instituteId: instIdObj,
            recipientUserId: st.userId,
            recipientStudentId: st._id,
            type: "test_scheduled",
            title: `📝 New Test Scheduled: ${examTitle}`,
            message: `${modeText} test is scheduled for ${formattedDate}${timeText} (${batchName}).`,
            link: "/my-tests",
            metadata: { examTitle, batchName, examDate, startTime, mode },
          });
        }
      }
    } catch {
      // Safe fallback
    }
  },

  // Event Dispatcher 6: Test Submitted
  sendTestSubmittedNotification: async (
    instituteId: string | Types.ObjectId,
    studentId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    examTitle: string
  ) => {
    return notificationService.createNotification({
      instituteId,
      recipientUserId: userId,
      recipientStudentId: studentId,
      type: "test_completed",
      title: "✅ Test Submitted Successfully",
      message: `Your online test "${examTitle}" was submitted. Scores are evaluated!`,
      link: "/my-tests",
      metadata: { examTitle },
    });
  },

  // Event Dispatcher 7: Test Evaluated & Rank
  sendTestEvaluatedNotification: async (
    instituteId: string | Types.ObjectId,
    studentId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    examTitle: string,
    marksObtained: number,
    totalMarks: number,
    rank?: number
  ) => {
    const rankText = rank ? ` (Class Rank #${rank})` : "";
    return notificationService.createNotification({
      instituteId,
      recipientUserId: userId,
      recipientStudentId: studentId,
      type: "test_evaluated",
      title: `🏆 Results Published: ${examTitle}`,
      message: `You scored ${marksObtained}/${totalMarks}${rankText}. View detailed solutions!`,
      link: "/my-tests",
      metadata: { examTitle, marksObtained, totalMarks, rank },
    });
  },
};
