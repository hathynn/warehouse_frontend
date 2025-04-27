import React from "react";
import { Tag } from "antd";

export type ImportStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type DetailStatus = "LACK" | "EXCESS" | "MATCH";

interface StatusTagProps {
  status: string;
  type: "import" | "detail";
}

const importStatusMap: Record<ImportStatus, { color: string; text: string }> = {
  NOT_STARTED: { color: "default", text: "Chưa bắt đầu" },
  IN_PROGRESS: { color: "processing", text: "Đang xử lý" },
  COMPLETED: { color: "success", text: "Hoàn tất" },
  CANCELLED: { color: "error", text: "Đã hủy" },
};

const detailStatusMap: Record<DetailStatus, { color: string; text: string }> = {
  LACK: { color: "error", text: "THIẾU" },
  EXCESS: { color: "error", text: "THỪA" },
  MATCH: { color: "success", text: "ĐỦ" },
};

const StatusTag: React.FC<StatusTagProps> = ({ status, type }) => {
  let color = "default";
  let text = status;

  if (type === "import" && status in importStatusMap) {
    color = importStatusMap[status as ImportStatus].color;
    text = importStatusMap[status as ImportStatus].text;
  } else if (type === "detail" && status in detailStatusMap) {
    color = detailStatusMap[status as DetailStatus].color;
    text = detailStatusMap[status as DetailStatus].text;
  }

  return <Tag color={color}>{text}</Tag>;
};

export default StatusTag; 