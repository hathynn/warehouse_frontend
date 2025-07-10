import React, { useEffect, useState } from "react";
import { Input, DatePicker, ConfigProvider } from "antd";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import useConfigurationService from "@/services/useConfigurationService";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";

const UseExportForm = ({
  formData,
  setFormData,
  openDepartmentModal,
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
        }
      } catch (error) {
        console.error("Error fetching configuration:", error);
      }
    };

    fetchConfiguration();
  }, []);

  // Chặn nhập quá 150 ký tự cho lí do xuất
  const handleReasonChange = (e) => {
    const value = e.target.value;
    if (value.length <= 150) {
      setFormData({ ...formData, exportReason: value });
      setMandatoryError("");
    }
  };

  // Tính ngày xuất sớm nhất dựa trên giờ hành chính và thời gian kiểm đếm
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

    // Thời gian kiểm đếm cố định 24h (sẽ config được sau)
    const INSPECTION_HOURS = 12;

    let startCalculationTime;

    // Case 1: Ngoài giờ hành chính
    if (now.isBefore(todayWorkStart) || now.isAfter(todayWorkEnd)) {
      // Nếu trước giờ làm việc hôm nay -> bắt đầu từ giờ làm việc hôm nay
      // Nếu sau giờ làm việc hôm nay -> bắt đầu từ giờ làm việc ngày mai
      if (now.isBefore(todayWorkStart)) {
        startCalculationTime = todayWorkStart;
      } else {
        startCalculationTime = todayWorkStart.add(1, "day");
      }
    }
    // Case 2: Trong giờ hành chính
    else {
      startCalculationTime = now;
    }

    // Tính toán thời gian sau khi cộng thêm INSPECTION_HOURS (chỉ tính giờ hành chính)
    let calculationTime = startCalculationTime.clone();
    let remainingHours = INSPECTION_HOURS;

    while (remainingHours > 0) {
      const currentDay = calculationTime.startOf("day");
      const workStart = currentDay.hour(startHour).minute(startMin);
      const workEnd = currentDay.hour(endHour).minute(endMin);

      // Nếu calculationTime trước giờ làm việc của ngày đó
      if (calculationTime.isBefore(workStart)) {
        calculationTime = workStart;
      }

      // Tính số giờ làm việc còn lại trong ngày
      const hoursLeftInDay = workEnd.diff(calculationTime, "hour", true);

      if (remainingHours <= hoursLeftInDay) {
        // Đủ giờ trong ngày hiện tại
        calculationTime = calculationTime.add(remainingHours, "hour");
        remainingHours = 0;
      } else {
        // Không đủ giờ, chuyển sang ngày tiếp theo
        remainingHours -= hoursLeftInDay;
        calculationTime = currentDay
          .add(1, "day")
          .hour(startHour)
          .minute(startMin);
      }
    }

    // Trả về ngày (không tính giờ phút)
    return calculationTime;
  };

  // Disable các ngày trước ngày xuất sớm nhất được phép
  const getDisabledDate = (current) => {
    if (!current) return false;

    const minExportDate = calculateMinExportDate();
    return current.isBefore(minExportDate.startOf("day")); // So sánh theo ngày, bỏ qua giờ
  };

  return (
    <>
      {/* Loại xuất */}
      <span className="font-semibold">Loại xuất: Sản Xuất</span>
      <div className="mb-2"></div>

      {/* Ngày xuất và Hạn kiểm đếm dự kiến */}
      <div className="mb-4 flex gap-4">
        {/* Ngày xuất */}
        <div className="w-1/2">
          <label className="block mb-1">
            Ngày xuất <span className="text-red-500">*</span>
          </label>

          <ConfigProvider>
            <div dir="rtl">
              <DatePicker
                locale={locale}
                format="DD-MM-YYYY"
                size="large"
                value={formData.exportDate ? dayjs(formData.exportDate) : null}
                onChange={(date) => {
                  const newDate = date?.isValid()
                    ? date.format("YYYY-MM-DD")
                    : null;

                  // Tính toán hạn kiểm đếm dự kiến và lưu vào formData
                  const inspectionDateTime = newDate
                    ? calculateMinExportDate()
                    : null;

                  setFormData({
                    ...formData,
                    exportDate: newDate,
                    inspectionDateTime: inspectionDateTime
                      ? inspectionDateTime.format("YYYY-MM-DD HH:mm:ss")
                      : null,
                  });
                  setMandatoryError("");
                }}
                className="w-full !mt-1 !p-[4px_8px]"
                allowClear
                placeholder="Chọn ngày xuất"
                disabledDate={getDisabledDate}
              />
            </div>
          </ConfigProvider>
          {!formData.exportDate && (
            <div className="text-red-500 text-xs mt-1">
              Vui lòng chọn ngày xuất tối thiểu sau 24h kiểm đếm trong giờ hành
              chính.
            </div>
          )}
        </div>

        {/* Hạn kiểm đếm dự kiến */}
        <div className="w-1/2">
          <label className="block mb-1">Hạn kiểm đếm dự kiến</label>
          <div>
            <Input
              value={calculateMinExportDate().format("DD-MM-YYYY HH:mm")}
              placeholder="Hạn kiểm đếm dự kiến"
              disabled
              size="large"
              className="w-full bg-gray-50 text-right"
            />
          </div>
        </div>
      </div>

      {/* Lý do xuất */}
      <div className="mb-4">
        <label className="block mb-1">
          Lý do xuất <span className="text-red-500">*</span>
        </label>
        <Input.TextArea
          value={formData.exportReason || ""}
          placeholder="Nhập lý do xuất"
          maxLength={150}
          rows={2}
          onChange={handleReasonChange}
          className="w-full"
          showCount
        />
        {!formData.exportReason && (
          <div className="text-red-500 text-xs mt-1">
            Vui lòng nhập lý do xuất.
          </div>
        )}
      </div>

      {/* Phòng ban: onClick mở modal */}
      <div className="mb-4">
        <label className="block mb-1">
          Phòng ban <span className="text-red-500">*</span>
        </label>
        <Input
          value={
            formData.receivingDepartment
              ? formData.receivingDepartment.name
              : ""
          }
          placeholder="Chọn phòng ban"
          readOnly
          onClick={openDepartmentModal}
          className="w-full cursor-pointer"
        />
        {!formData.receivingDepartment && (
          <div className="text-red-500 text-xs mt-1">
            Vui lòng chọn phòng ban.
          </div>
        )}
      </div>

      {/* Người đại diện phòng ban */}
      <div className="mb-4">
        <label className="block mb-1">Người đại diện phòng ban</label>
        <Input
          value={formData.departmentRepresentative || ""}
          placeholder="Tự động điền sau khi chọn phòng ban"
          readOnly
          className="w-full"
          style={{
            backgroundColor: "#cfcfcf",
            cursor: "not-allowed",
          }}
        />
      </div>

      {/* Số điện thoại người đại diện */}
      <div className="mb-4">
        <label className="block mb-1">Số điện thoại người đại diện</label>
        <Input
          value={formData.departmentRepresentativePhone || ""}
          placeholder="Tự động điền sau khi chọn phòng ban"
          readOnly
          className="w-full"
          style={{
            backgroundColor: "#cfcfcf",
            cursor: "not-allowed",
          }}
        />
      </div>
    </>
  );
};

UseExportForm.propTypes = {
  formData: PropTypes.shape({
    exportReason: PropTypes.string,
    exportDate: PropTypes.string,
    inspectionDateTime: PropTypes.string,
    receivingDepartment: PropTypes.object,
    departmentRepresentative: PropTypes.string,
    departmentRepresentativePhone: PropTypes.string,
    note: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  openDepartmentModal: PropTypes.func.isRequired,
  mandatoryError: PropTypes.string,
  setMandatoryError: PropTypes.func,
};

export default UseExportForm;
