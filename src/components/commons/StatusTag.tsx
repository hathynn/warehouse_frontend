import React from "react";
import { Tag } from "antd";
import { ImportStatus, ExportStatus, DetailStatus, StockcheckStatus } from "@/utils/enums";

interface StatusTagProps {
  status: string;
  type: "import" | "export" | "detail" | "stockcheck";
}

const importStatusMap: Record<ImportStatus, { color: string; text: string }> = {
  NOT_STARTED: { color: "default", text: "Chưa bắt đầu" },
  IN_PROGRESS: { color: "processing", text: "Đang xử lý" },
  COUNTED: { color: "processing", text: "Đã kiểm đếm" },
  CONFIRMED: { color: "processing", text: "Đã xác nhận" },
  COMPLETED: { color: "success", text: "Hoàn tất" },
  CANCELLED: { color: "error", text: "Đã hủy" },
  EXTENDED: { color: "warning", text: "Đã gia hạn" },
  COUNT_AGAIN_REQUESTED: { color: "warning", text: "Cần kiểm đếm lại" },
  READY_TO_STORE: { color: "success", text: "Sẵn sàng lưu kho" },
  STORED: { color: "success", text: "Đã lưu kho" },
};

const exportStatusMap: Record<ExportStatus, { color: string; text: string }> = {
  NOT_STARTED: { color: "default", text: "Chưa bắt đầu" },
  IN_PROGRESS: { color: "processing", text: "Đang xử lý" },
  COUNTED: { color: "processing", text: "Đã đóng gói" },
  COUNT_CONFIRMED: { color: "processing", text: "Đã xác nhận đóng gói" },
  WAITING_EXPORT: { color: "warning", text: "Chờ xuất kho" },
  EXTENDED: { color: "warning", text: "Hoãn xuất kho" },
  CONFIRMED: { color: "processing", text: "Đã xuất kho" },
  COMPLETED: { color: "green", text: "Hoàn tất" },
  CANCELLED: { color: "default", text: "Đã hủy" },
};

const detailStatusMap: Record<DetailStatus, { color: string; text: string }> = {
  LACK: { color: "error", text: "THIẾU" },
  EXCESS: { color: "warning", text: "THỪA" },
  MATCH: { color: "success", text: "ĐỦ" },
};

const stockcheckStatusMap: Record<StockcheckStatus, { color: string; text: string }> = {
  NOT_STARTED: { color: "default", text: "Chưa bắt đầu" },
  IN_PROGRESS: { color: "processing", text: "Đang xử lý" },
  COUNTED: { color: "processing", text: "Đã đóng gói" },
  COUNT_CONFIRMED: { color: "processing", text: "Đã xác nhận đóng gói" },
  CONFIRMED: { color: "processing", text: "Đã xuất kho" },
  COMPLETED: { color: "green", text: "Hoàn tất" },
  CANCELLED: { color: "default", text: "Đã hủy" },
};

const StatusTag: React.FC<StatusTagProps> = ({ status, type }) => {
  let color = "default";
  let text = status;

  if (type === "import" && status in importStatusMap) {
    color = importStatusMap[status as ImportStatus].color;
    text = importStatusMap[status as ImportStatus].text;
  } else if (type === "export" && status in exportStatusMap) {
    color = exportStatusMap[status as ExportStatus].color;
    text = exportStatusMap[status as ExportStatus].text;
  } else if (type === "detail" && status in detailStatusMap) {
    color = detailStatusMap[status as DetailStatus].color;
    text = detailStatusMap[status as DetailStatus].text;
  } else if (type === "stockcheck" && status in stockcheckStatusMap) {
    color = stockcheckStatusMap[status as StockcheckStatus].color;
    text = stockcheckStatusMap[status as StockcheckStatus].text;
  }

  return <Tag color={color}>{text}</Tag>;
};

export default StatusTag;