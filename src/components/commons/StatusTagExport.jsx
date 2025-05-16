import React from "react";
import { Tag } from "antd"; // Import Tag from Ant Design
import PropTypes from "prop-types";

// Mapping for export statuses
const exportStatusMap = {
  NOT_STARTED: { color: "default", text: "Chưa bắt đầu" },
  IN_PROGRESS: { color: "processing", text: "Đang xử lý" },
  COUNTED: { color: "processing", text: "Đã kiểm đếm" },
  COUNT_CONFIRMED: { color: "processing", text: "Đã xác nhận kiểm đếm" },
  WAITING_EXPORT: { color: "processing", text: "Chờ xuất kho" },
  CONFIRMED: { color: "processing", text: "Đã xác nhận xuất kho" },
  COMPLETED: { color: "success", text: "Hoàn tất" },
  CANCELLED: { color: "error", text: "Đã hủy" },
};

// Mapping for detail statuses
const detailStatusMap = {
  LACK: { color: "error", text: "THIẾU" },
  EXCESS: { color: "error", text: "THỪA" },
  MATCH: { color: "success", text: "ĐỦ" },
};

// StatusTag component that takes status and type as props
const StatusTag = ({ status, type }) => {
  let color = "default"; // Default color
  let text = status; // Default text is the status value

  // Check if it's an export status and get the corresponding color and text
  if (type === "export" && status in exportStatusMap) {
    color = exportStatusMap[status].color;
    text = exportStatusMap[status].text;
  }
  // Check if it's a detail status and get the corresponding color and text
  else if (type === "detail" && status in detailStatusMap) {
    color = detailStatusMap[status].color;
    text = detailStatusMap[status].text;
  }

  return <Tag color={color}>{text}</Tag>; // Render the Tag component
};

StatusTag.propTypes = {
  status: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["export", "detail"]).isRequired,
};
export default StatusTag; // Export the component
