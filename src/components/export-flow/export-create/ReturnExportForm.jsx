import React, { useEffect, useState } from "react";
import { Input, DatePicker } from "antd";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import useConfigurationService from "@/services/useConfigurationService";

const ReturnExportForm = ({
  formData,
  setFormData,
  mandatoryError,
  setMandatoryError,
}) => {
  const [workingTimeConfig, setWorkingTimeConfig] = useState({
    workingTimeStart: null,
    workingTimeEnd: null,
  });

  // Sử dụng configuration service
  const { getConfiguration, loading: configLoading } =
    useConfigurationService();

  // Lấy cấu hình working time khi component mount
  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        const config = await getConfiguration();
        if (config) {
          setWorkingTimeConfig({
            workingTimeStart: config.workingTimeStart,
            workingTimeEnd: config.workingTimeEnd,
          });
          console.log("Working time config:", {
            start: config.workingTimeStart,
            end: config.workingTimeEnd,
          });
        }
      } catch (error) {
        console.error("Error fetching configuration:", error);
      }
    };

    fetchConfiguration();
  }, []);

  // Tính ngày xuất sớm nhất dựa trên logic mới
  const calculateMinExportDate = () => {
    if (
      !workingTimeConfig.workingTimeStart ||
      !workingTimeConfig.workingTimeEnd
    ) {
      return dayjs().startOf("day"); // Fallback nếu chưa có config
    }

    const now = dayjs();
    const today = now.startOf("day");

    // Parse working hours
    const [startHour, startMin] = workingTimeConfig.workingTimeStart
      .split(":")
      .map(Number);
    const [endHour, endMin] = workingTimeConfig.workingTimeEnd
      .split(":")
      .map(Number);

    const todayWorkStart = today.hour(startHour).minute(startMin);
    const todayWorkEnd = today.hour(endHour).minute(endMin);

    // Logic mới:
    // 1. Nếu sau giờ làm việc (sau 17h) -> ngày mai
    if (now.isAfter(todayWorkEnd)) {
      return today.add(1, "day");
    }

    // 2. Nếu trước giờ làm việc (trước 7h) -> hôm nay
    // 3. Nếu trong giờ làm việc -> hôm nay
    return today;
  };

  // Chặn nhập quá 150 ký tự cho lí do xuất
  const handleReasonChange = (e) => {
    const value = e.target.value;
    if (value.length <= 150) {
      setFormData({ ...formData, exportReason: value });
      setMandatoryError?.("");
    }
  };

  // Disable các ngày trong quá khứ và áp dụng logic mới
  const getDisabledDate = (current) => {
    if (!current) return false;

    const minExportDate = calculateMinExportDate();
    return current.isBefore(minExportDate);
  };

  return (
    <>
      <span className="font-semibold">Loại xuất: Xuất trả nhà cung cấp</span>

      {/* Hiển thị thông tin working time và ngày xuất sớm nhất nếu có
      {workingTimeConfig.workingTimeStart &&
        workingTimeConfig.workingTimeEnd && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="text-blue-700 mb-1">
              ⏰ Giờ làm việc: {workingTimeConfig.workingTimeStart} -{" "}
              {workingTimeConfig.workingTimeEnd}
            </div>
            <div className="text-blue-600">
              📅 Ngày xuất sớm nhất:{" "}
              {calculateMinExportDate().format("DD/MM/YYYY")}
            </div>
          </div>
        )} */}

      {/* Ngày xuất */}
      <div className="mb-4 mt-5">
        <label className="block mb-1">
          Ngày xuất <span className="text-red-500">*</span>
        </label>
        <DatePicker
          format="DD-MM-YYYY"
          value={formData.exportDate ? dayjs(formData.exportDate) : null}
          onChange={(date) => {
            const newDate = date?.isValid() ? date.format("YYYY-MM-DD") : null;
            setFormData({
              ...formData,
              exportDate: newDate,
            });
            setMandatoryError?.("");
          }}
          className="w-full"
          allowClear
          placeholder="Chọn ngày xuất"
          disabledDate={getDisabledDate}
        />
        {!formData.exportDate && (
          <div className="text-red-500 text-xs mt-1">
            Vui lòng chọn ngày xuất.
          </div>
        )}
      </div>

      {/* Lí do xuất */}
      <div className="mb-4">
        <label className="block mb-1">
          Lí do xuất trả <span className="text-red-500">*</span>
        </label>
        <Input.TextArea
          value={formData.exportReason || ""}
          placeholder="Nhập lí do xuất (tối đa 150 ký tự)"
          maxLength={150}
          rows={2}
          onChange={handleReasonChange}
          className="w-full"
          showCount
        />
        {!formData.exportReason && (
          <div className="text-red-500 text-xs mt-1">
            Vui lòng nhập lí do xuất.
          </div>
        )}
      </div>
    </>
  );
};

ReturnExportForm.propTypes = {
  formData: PropTypes.shape({
    exportDate: PropTypes.string,
    exportReason: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  mandatoryError: PropTypes.string,
  setMandatoryError: PropTypes.func,
};

export default ReturnExportForm;
