import React, { useEffect, useState } from "react";
import { Input, DatePicker, ConfigProvider } from "antd";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";
import holidaysData from "@/assets/data/holidays-2025.json";

const UseExportForm = ({
  formData,
  setFormData,
  openDepartmentModal,
  mandatoryError,
  setMandatoryError,
  excelFormData,
}) => {
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);

  // THÊM useEffect để xử lý auto-fill từ Excel
  useEffect(() => {
    if (excelFormData && !hasAutoFilled) {
      setFormData((prev) => ({
        ...prev,
        exportReason: prev.exportReason || excelFormData.exportReason || "",
        // Có thể thêm các field khác nếu cần
      }));

      setHasAutoFilled(true); // ĐÁNH DẤU ĐÃ AUTO-FILL
    }
  }, [excelFormData, hasAutoFilled]);

  useEffect(() => {
    setHasAutoFilled(false);
  }, [formData.exportType]);

  useEffect(() => {
    try {
      // Gộp tất cả ngày bị chặn
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

  // Tự động điền ngày xuất hợp lệ gần nhất khi component mount
  useEffect(() => {
    if (!formData.exportDate && blockedDates.length > 0) {
      const minExportDate = calculateMinExportDate();
      const validDate = minExportDate.format("YYYY-MM-DD");

      setFormData((prev) => ({
        ...prev,
        exportDate: validDate,
        inspectionDateTime: minExportDate.format("YYYY-MM-DD HH:mm:ss"),
      }));
    }
  }, [blockedDates, formData.exportDate]);

  const isDateBlocked = (date) => {
    const dateString = dayjs(date).format("YYYY-MM-DD");
    return blockedDates.includes(dateString);
  };

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
    const now = dayjs();
    const INSPECTION_HOURS = 3;
    let calculationTime = now;
    let remainingHours = INSPECTION_HOURS;

    // Nếu hiện tại đang ở ngày nghỉ, chuyển đến 0h ngày làm việc tiếp theo
    if (isDateBlocked(calculationTime)) {
      calculationTime = calculationTime.add(1, "day").startOf("day");
      while (isDateBlocked(calculationTime)) {
        calculationTime = calculationTime.add(1, "day").startOf("day");
      }
    }

    // Cộng dần từng giờ, bỏ qua ngày nghỉ
    while (remainingHours > 0) {
      // Kiểm tra nếu đang ở ngày nghỉ thì chuyển sang ngày làm việc tiếp theo
      if (isDateBlocked(calculationTime)) {
        calculationTime = calculationTime.add(1, "day").startOf("day");
        continue;
      }

      // Tính số giờ còn lại trong ngày hiện tại (từ thời điểm hiện tại đến hết ngày)
      const endOfDay = calculationTime.endOf("day");
      const hoursLeftInDay = endOfDay.diff(calculationTime, "hour", true);

      if (remainingHours <= hoursLeftInDay) {
        // Đủ giờ trong ngày hiện tại
        calculationTime = calculationTime.add(remainingHours, "hour");
        remainingHours = 0;
      } else {
        // Không đủ giờ, chuyển sang ngày tiếp theo
        remainingHours -= hoursLeftInDay;
        calculationTime = calculationTime.add(1, "day").startOf("day");
      }
    }

    return calculationTime;
  };

  // Disable các ngày trước ngày xuất sớm nhất được phép
  const getDisabledDate = (current) => {
    if (!current) return false;

    const minExportDate = calculateMinExportDate();

    // Disable nếu ngày < minExportDate HOẶC nằm trong danh sách ngày bị chặn
    return (
      current.isBefore(minExportDate.startOf("day")) || isDateBlocked(current)
    );
  };

  return (
    <>
      {/* Loại xuất */}
      <span className="font-semibold">Loại xuất: Nội bộ</span>
      <div className="mb-2"></div>

      {/* THÊM thông báo nếu data được load từ Excel */}
      {excelFormData && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          ✓ Thông tin đã được tự động điền từ file Excel
        </div>
      )}

      {/* Ngày xuất và Hạn kiểm đếm dự kiến */}
      <div className="mb-4 flex gap-4">
        {/* Ngày xuất */}
        <div className={"w-1/2"}>
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

                  // Tính toán hạn kiểm đếm dự kiến
                  let inspectionDateTime = null;
                  if (newDate) {
                    const minExportDate = calculateMinExportDate();
                    const selectedDate = dayjs(newDate);

                    // Nếu chọn ngày sớm nhất có thể
                    if (selectedDate.isSame(minExportDate, "day")) {
                      inspectionDateTime = minExportDate; // Dùng thời gian chính xác từ logic tính toán
                    } else {
                      // Nếu chọn ngày sau đó, set giờ 00:00:00 (0h sáng)
                      inspectionDateTime = selectedDate
                        .hour(0)
                        .minute(0)
                        .second(0);
                    }
                  }

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
            <div className="text-blue-800 text-xs mt-1">
              <span className="font-bold">Thông tin: </span> Mất tối đa{" "}
              <span className="font-bold text-red-800">3h</span> kiểm đếm.
            </div>
          )}
        </div>

        {/* Hạn kiểm đếm dự kiến */}
        <div className="w-1/2">
          <label className="block mb-1">Hạn kiểm đếm dự kiến</label>
          <div>
            <Input
              value={
                formData.exportDate &&
                (formData.inspectionDateTime
                  ? dayjs(formData.inspectionDateTime).format(
                      "DD-MM-YYYY HH:mm"
                    )
                  : calculateMinExportDate().format("DD-MM-YYYY HH:mm"))
              }
              placeholder="-"
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
          {excelFormData?.exportReason && (
            <span className="text-blue-500 text-xs ml-1">(từ Excel)</span>
          )}
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
    exportType: PropTypes.string, // Added missing prop type
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  openDepartmentModal: PropTypes.func.isRequired,
  mandatoryError: PropTypes.string,
  setMandatoryError: PropTypes.func,
  excelFormData: PropTypes.shape({
    exportReason: PropTypes.string,
    departmentId: PropTypes.string,
  }),
};

export default UseExportForm;
