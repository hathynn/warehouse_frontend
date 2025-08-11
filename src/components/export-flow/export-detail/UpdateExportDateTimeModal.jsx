import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  DatePicker,
  Checkbox,
  Button,
  message,
  Spin,
  Select,
  ConfigProvider,
} from "antd";
import dayjs from "dayjs";
import PropTypes from "prop-types";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { InfoCircleOutlined } from "@ant-design/icons";
import useDepartmentService from "@/services/useDepartmentService";
import holidaysData from "@/assets/data/holidays-2025.json";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const UpdateExportDateTimeModal = ({
  open,
  onCancel,
  onSuccess,
  exportRequest,
  updateExportDateTime,
  updateExportRequestStatus,
  updateExportRequestDepartment, // THÊM prop này
  loading,
  exportDate,
  getWaitingExportStartTime,
  departmentInfo, // THÊM prop này
}) => {
  const [date, setDate] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const [blockedDates, setBlockedDates] = useState([]);
  const [changeDate, setChangeDate] = useState(false);

  // States cho department
  const [changeDepartment, setChangeDepartment] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [departmentSearchText, setDepartmentSearchText] = useState("");

  const { getAllDepartments, loading: departmentLoading } =
    useDepartmentService();
  const [departments, setDepartments] = useState([]);

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

  //Use effects
  // 1. Load departments when modal opens
  useEffect(() => {
    if (open && departments.length === 0) {
      const loadDepartments = async () => {
        try {
          const response = await getAllDepartments(1, 100);
          if (response && response.content) {
            setDepartments(response.content);
          }
        } catch (error) {
          console.error("Error loading departments:", error);
        }
      };
      loadDepartments();
    }
  }, [open, getAllDepartments, departments.length]);

  // 2. Load blocked dates from holidays data
  useEffect(() => {
    try {
      const allBlockedDates = [
        ...holidaysData.fixedHolidays.map((h) => h.date),
        ...holidaysData.lunarHolidays.map((h) => h.date),
        ...holidaysData.sundays,
      ];
      setBlockedDates(allBlockedDates);
    } catch (error) {
      console.error("Error loading holidays data:", error);
    }
  }, []);

  // 3. Calculate remaining time
  useEffect(() => {
    if (!open) return;

    setRemainingTime(calculateRemainingTime());

    const interval = setInterval(() => {
      setRemainingTime(calculateRemainingTime());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [open, calculateRemainingTime]);

  // 4. Set initial values when modal opens
  useEffect(() => {
    if (open && exportDate) {
      setDate(dayjs(exportDate));
      setConfirmed(false);
      setDepartmentSearchText("");

      // Logic theo type
      if (exportRequest?.type === "INTERNAL") {
        // INTERNAL: không check gì cả
        setChangeDepartment(false);
        setSelectedDepartmentId(null);
        setChangeDate(false);
      } else {
        // Các type khác: chỉ check đổi ngày, disable checkbox
        setChangeDepartment(false);
        setSelectedDepartmentId(null);
        setChangeDate(true); // Tự động check
      }
    }
  }, [open, exportDate, exportRequest?.type]);

  // 5. Reset states when modal closes
  useEffect(() => {
    if (!open) {
      setDate(null);
      setConfirmed(false);
      setSubmitting(false);
      setChangeDepartment(false);
      setSelectedDepartmentId(null);
      setDepartmentSearchText("");
      setChangeDate(false);
    }
  }, [open]);

  const isDateBlocked = (date) => {
    const dateString = dayjs(date).format("YYYY-MM-DD");
    return blockedDates.includes(dateString);
  };

  const handleOk = async () => {
    // Nếu không tick đổi ngày thì chỉ cập nhật department
    if (!changeDate) {
      // Nếu có đổi phòng ban thì cập nhật department
      if (changeDepartment && selectedDepartmentId) {
        setSubmitting(true);
        try {
          await updateExportRequestDepartment({
            exportRequestId: String(exportRequest.exportRequestId),
            departmentId: selectedDepartmentId,
          });
          message.success("Đã cập nhật phòng ban thành công!");
          onSuccess && onSuccess();
        } catch (e) {
          // Lỗi đã được handle ở hook
        } finally {
          setSubmitting(false);
        }
      } else {
        message.warning("Không có thay đổi nào để cập nhật.");
      }
      return;
    }

    // Logic cũ cho việc cập nhật ngày
    if (!date) {
      message.warning("Vui lòng nhập ngày xuất.");
      return;
    }

    if (
      date.isBefore(dayjs(), "day") ||
      date.isSame(dayjs(exportDate), "day")
    ) {
      message.error(
        "Vui lòng chọn ngày từ ngày mai trở đi và khác ngày xuất hiện tại"
      );
      return;
    }

    // Kiểm tra nếu tick đổi phòng ban nhưng không chọn phòng ban khác
    if (
      changeDepartment &&
      (!selectedDepartmentId ||
        selectedDepartmentId === exportRequest.departmentId)
    ) {
      message.warning("Vui lòng chọn phòng ban khác để đổi.");
      return;
    }

    setSubmitting(true);
    try {
      // Cập nhật ngày xuất
      await updateExportDateTime(String(exportRequest.exportRequestId), {
        date: date.format("YYYY-MM-DD"),
      });

      // Nếu có đổi phòng ban thì cập nhật department
      if (changeDepartment && selectedDepartmentId) {
        await updateExportRequestDepartment({
          exportRequestId: String(exportRequest.exportRequestId),
          departmentId: selectedDepartmentId,
        });
      }

      message.success("Đã cập nhật thông tin thành công!");
      onSuccess && onSuccess();
    } catch (e) {
      // Lỗi đã được handle ở hook
    } finally {
      setSubmitting(false);
    }
  };

  const isValidDate = () => {
    if (!date) return false;
    const today = dayjs().startOf("day");
    const exportDateDay = dayjs(exportDate).startOf("day");

    return (
      date.isSameOrAfter(today, "day") && !date.isSame(exportDateDay, "day")
    );
  };

  const getExportTypeText = (type) => {
    switch (type) {
      case "INTERNAL":
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

  // Filter departments based on search text
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.departmentName
        .toLowerCase()
        .includes(departmentSearchText.toLowerCase()) ||
      dept.departmentResponsible
        .toLowerCase()
        .includes(departmentSearchText.toLowerCase())
  );

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
          <div className="!bg-blue-50 -mx-6 -mt-4 px-6 py-4 border-b">
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: "#1890ff",
                marginBottom: 8,
              }}
            >
              Cập nhật thông tin nhận hàng
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
            disabled={
              !confirmed ||
              (!changeDate &&
                (exportRequest?.type !== "INTERNAL" || !changeDepartment)) ||
              (changeDate &&
                (!date || !minDate || !isValidDate() || isDateBlocked(date))) ||
              (exportRequest?.type === "INTERNAL" &&
                changeDepartment &&
                (!selectedDepartmentId ||
                  selectedDepartmentId === exportRequest.departmentId))
            }
            loading={submitting || loading}
            onClick={handleOk}
          >
            Xác nhận
          </Button>,
        ]}
        width={520}
        centered
      >
        {!minDate ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="mb-1">
                <b>Phiếu xuất:</b> #{exportRequest.exportRequestId}
              </div>
              <div className="mb-1">
                <b>Loại xuất:</b> {getExportTypeText(exportRequest.type)}
              </div>
              <div>
                <b>Ngày xuất hiện tại:</b>{" "}
                {dayjs(exportDate).format("DD/MM/YYYY")}
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-3">
                <div className="mb-3 flex items-center justify-end gap-2">
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>
                    Đổi ngày khách nhận hàng
                  </span>
                  <Checkbox
                    checked={changeDate}
                    disabled={exportRequest?.type !== "INTERNAL"} // Disable nếu không phải INTERNAL
                    onChange={(e) => {
                      if (exportRequest?.type === "INTERNAL") {
                        // Chỉ cho phép thay đổi nếu là INTERNAL
                        setChangeDate(e.target.checked);
                        if (!e.target.checked) {
                          setDate(dayjs(exportDate));
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <label
                className="block mb-2"
                style={{ fontWeight: 600, fontSize: "14px" }}
              >
                Ngày khách nhận hàng:
              </label>
              <ConfigProvider>
                <DatePicker
                  locale={locale}
                  value={date}
                  onChange={setDate}
                  style={{ width: "100%", height: "40px" }}
                  placeholder="Chọn ngày"
                  format="DD/MM/YYYY"
                  disabled={!changeDate}
                  disabledDate={(current) => {
                    if (!current) return false;
                    const today = dayjs().startOf("day");
                    const currentExportDate = dayjs(exportDate).startOf("day");

                    return (
                      current.isBefore(today, "day") ||
                      current.isSame(currentExportDate, "day") ||
                      isDateBlocked(current)
                    );
                  }}
                />
              </ConfigProvider>
              {changeDate &&
                date &&
                (date.isBefore(dayjs(), "day") ||
                  date.isSame(dayjs(exportDate), "day") ||
                  isDateBlocked(date)) && (
                  <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>
                      {isDateBlocked(date)
                        ? "Không thể chọn ngày lễ/cuối tuần"
                        : "Vui lòng chọn ngày từ hôm nay trở đi và khác ngày xuất hiện tại"}
                    </span>
                  </div>
                )}
            </div>

            {/* PHẦN MỚI: Department Section */}
            {exportRequest?.type === "INTERNAL" && (
              <div className="mb-6">
                <div className="mb-3">
                  <div className="mb-3 flex items-center justify-end gap-2">
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>
                      Đổi phòng ban nhận hàng
                    </span>
                    <Checkbox
                      checked={changeDepartment}
                      onChange={(e) => {
                        setChangeDepartment(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedDepartmentId(null);
                          setDepartmentSearchText("");
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label
                    className="block mb-2"
                    style={{ fontWeight: 600, fontSize: "14px" }}
                  >
                    Phòng ban nhận hàng:
                  </label>
                  <Select
                    style={{ width: "100%", minHeight: "40px" }}
                    placeholder="Chọn phòng ban"
                    disabled={!changeDepartment}
                    value={
                      changeDepartment
                        ? selectedDepartmentId
                        : departmentInfo?.id
                    }
                    onChange={setSelectedDepartmentId}
                    showSearch
                    searchValue={departmentSearchText}
                    onSearch={setDepartmentSearchText}
                    filterOption={false}
                    loading={departmentLoading}
                    optionLabelProp="label"
                  >
                    {!changeDepartment && departmentInfo && (
                      <Select.Option
                        key={departmentInfo.id}
                        value={departmentInfo.id}
                        label={departmentInfo.departmentName}
                      >
                        <div className="py-2">
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "14px",
                              color: "#1f1f1f",
                            }}
                          >
                            {departmentInfo.departmentName}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#8c8c8c",
                              marginTop: "2px",
                            }}
                          >
                            Đại diện: {departmentInfo.departmentResponsible}
                          </div>
                        </div>
                      </Select.Option>
                    )}

                    {changeDepartment &&
                      filteredDepartments.map((dept) => (
                        <Select.Option
                          key={dept.id}
                          value={dept.id}
                          label={dept.departmentName}
                        >
                          <div className="py-2">
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: "14px",
                                color: "#1f1f1f",
                              }}
                            >
                              {dept.departmentName}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#8c8c8c",
                                marginTop: "2px",
                              }}
                            >
                              Đại diện: {dept.departmentResponsible}
                            </div>
                          </div>
                        </Select.Option>
                      ))}
                  </Select>

                  {changeDepartment &&
                    selectedDepartmentId === exportRequest.departmentId && (
                      <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Vui lòng chọn phòng ban khác để đổi</span>
                      </div>
                    )}
                </div>
              </div>
            )}

            <div className="mb-2">
              <Checkbox
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={!isValidDate()}
                style={{ fontSize: "14px", lineHeight: "1.4" }}
              >
                <span style={{ fontWeight: 500 }}>
                  Tôi đã liên hệ với khách hàng và xác nhận thông tin trên là
                  đúng.
                </span>
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
    departmentId: PropTypes.number,
  }).isRequired,
  updateExportDateTime: PropTypes.func.isRequired,
  updateExportRequestStatus: PropTypes.func.isRequired,
  updateExportRequestDepartment: PropTypes.func.isRequired, // THÊM prop type
  loading: PropTypes.bool,
  exportDate: PropTypes.string.isRequired,
  getWaitingExportStartTime: PropTypes.func.isRequired,
  departmentInfo: PropTypes.shape({
    id: PropTypes.number,
    departmentName: PropTypes.string,
    departmentResponsible: PropTypes.string,
  }), // THÊM prop type
};

export default UpdateExportDateTimeModal;
