import React, { useState, useEffect, useCallback } from "react";
import { Modal, DatePicker, Checkbox, Button, message, Spin } from "antd";
import dayjs from "dayjs";
import PropTypes from "prop-types";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { InfoCircleOutlined } from "@ant-design/icons";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const UpdateExportDateTimeModal = ({
  open,
  onCancel,
  onSuccess,
  exportRequest,
  updateExportDateTime,
  updateExportRequestStatus,
  loading,
  exportDate,
  getWaitingExportStartTime,
}) => {
  const [date, setDate] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");

  // Tính minDate từ exportDate
  const minDate = exportDate ? dayjs(exportDate) : null;

  const calculateRemainingTime = useCallback(() => {
    const startTime = getWaitingExportStartTime();
    if (!startTime) {
      return "Không xác định";
    }

    const now = new Date();
    const threeHoursMs = 3 * 60 * 60 * 1000;
    const deadline = new Date(startTime.getTime() + threeHoursMs);

    const diffMs = deadline.getTime() - now.getTime();
    if (diffMs <= 0) return "Đã hết hạn";

    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffMins = diffMinutes % 60;

    return `${diffHours} tiếng ${diffMins} phút`;
  }, [getWaitingExportStartTime]);

  useEffect(() => {
    if (!open) return;

    // Cập nhật ngay lập tức
    setRemainingTime(calculateRemainingTime());

    // Set interval 5 phút = 5 * 60 * 1000 ms
    const interval = setInterval(() => {
      setRemainingTime(calculateRemainingTime());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [open, calculateRemainingTime]);

  // Set date mặc định là exportDate khi mở modal
  useEffect(() => {
    if (open && exportDate) {
      setDate(dayjs(exportDate));
      setConfirmed(false); // Reset confirmed state
    }
  }, [open, exportDate]);

  // Reset states khi đóng modal
  useEffect(() => {
    if (!open) {
      setDate(null);
      setConfirmed(false);
      setSubmitting(false);
    }
  }, [open]);

  const handleOk = async () => {
    if (!date) {
      message.warning("Vui lòng nhập ngày xuất.");
      return;
    }

    if (date.isBefore(minDate, "day")) {
      message.error(
        "Ngày nhận hàng phải từ ngày: " + minDate.format("DD/MM/YYYY")
      );
      return;
    }

    setSubmitting(true);
    try {
      await updateExportDateTime(String(exportRequest.exportRequestId), {
        date: date.format("YYYY-MM-DD"),
      });
      message.success("Đã cập nhật ngày khách nhận hàng!");
      onSuccess && onSuccess();
    } catch (e) {
      // Lỗi đã được handle ở hook
    } finally {
      setSubmitting(false);
    }
  };

  const isValidDate = () => {
    if (!date || !minDate) return false;
    return date.isSameOrAfter(minDate, "day");
  };

  const getExportTypeText = (type) => {
    switch (type) {
      case "PRODUCTION":
        return "Xuất nội bộ";
      case "SELLING":
        return "Xuất bán";
      case "RETURN":
        return "Xuất trả nhà cung cấp";
      case "LIQUIDATION":
        return "Xuất thanh lý";
      default:
        return "Không xác định";
    }
  };

  return (
    <>
      <style>
        {`
          .ant-checkbox-inner {
            border-width: 0.5px !important;
            border-color: grey !important;
          }
        `}
      </style>
      <Modal
        open={open}
        title={
          // ✅ THÊM: Header nổi bật với background xanh nhạt
          <div className="!bg-blue-50 -mx-6 -mt-4 px-6 py-4 border-b">
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: "#1890ff",
                marginBottom: 8,
              }}
            >
              Cập nhật ngày khách nhận hàng
            </div>
            <div className="flex items-center gap-2 text-black-600">
              <InfoCircleOutlined style={{ fontSize: 16 }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                Thời gian còn lại để cập nhật:{" "}
                <span className="text-orange-600">{remainingTime}</span>
              </span>
            </div>
          </div>
        }
        onCancel={onCancel}
        footer={[
          <Button key="back" onClick={onCancel}>
            Quay lại
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!confirmed || !date || !minDate || !isValidDate()}
            loading={submitting || loading}
            onClick={handleOk}
          >
            Xác nhận
          </Button>,
        ]}
        width={480}
        centered
        destroyOnClose
      >
        {!minDate ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="mb-2">
                <b>Phiếu xuất:</b> #{exportRequest.exportRequestId}
              </div>
              <div className="mb-2">
                <b>Loại xuất:</b> {getExportTypeText(exportRequest.type)}
              </div>
              <div>
                <b>Ngày xuất hiện tại:</b>{" "}
                {dayjs(exportDate).format("DD/MM/YYYY")}
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2">
                <b>Ngày khách nhận hàng:</b>
              </label>
              <DatePicker
                value={date}
                onChange={setDate}
                style={{ width: "100%" }}
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                disabledDate={(current) =>
                  current && current.isBefore(minDate, "day")
                }
              />
              {date && date.isBefore(minDate, "day") && (
                <div className="text-red-500 text-sm mt-1">
                  Ngày nhận hàng phải từ ngày {minDate.format("DD/MM/YYYY")} trở
                  đi
                </div>
              )}
            </div>

            <div className="mb-2">
              <Checkbox
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={!isValidDate()}
              >
                Tôi đã liên hệ với khách hàng và xác nhận ngày nhận hàng trên là
                đúng.
              </Checkbox>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

UpdateExportDateTimeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  exportRequest: PropTypes.shape({
    exportRequestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
  updateExportDateTime: PropTypes.func.isRequired,
  updateExportRequestStatus: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  exportDate: PropTypes.string.isRequired,
  getWaitingExportStartTime: PropTypes.func.isRequired,
};

export default UpdateExportDateTimeModal;
