import React, { useEffect, useState } from "react";
import { Input, DatePicker, ConfigProvider } from "antd";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";
import holidaysData from "@/assets/data/holidays-2025.json";

const SellingExportForm = ({
  formData,
  setFormData,
  mandatoryError,
  setMandatoryError,
  excelFormData,
}) => {
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);

  useEffect(() => {
    if (excelFormData && !hasAutoFilled) {
      setFormData((prev) => ({
        ...prev,
        // Ưu tiên data từ Excel nếu có, nếu không thì giữ nguyên giá trị hiện tại
        exportReason: excelFormData.exportReason || prev.exportReason || "",
        receiverName: excelFormData.receiverName || prev.receiverName || "",
        receiverPhone: excelFormData.receiverPhone || prev.receiverPhone || "",
        receiverAddress:
          excelFormData.receiverAddress || prev.receiverAddress || "",
      }));

      setHasAutoFilled(true);
    }
  }, [excelFormData, hasAutoFilled, setFormData]);

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

  // Chặn nhập quá 150 ký tự cho lí do xuất
  const handleReasonChange = (e) => {
    const value = e.target.value;
    if (value.length <= 150) {
      setFormData({ ...formData, exportReason: value });
      setMandatoryError("");
    }
  };

  const isDateBlocked = (date) => {
    const dateString = dayjs(date).format("YYYY-MM-DD");
    return blockedDates.includes(dateString);
  };

  // Tính ngày xuất sớm nhất dựa trên giờ hành chính và thời gian kiểm đếm
  const calculateMinExportDate = () => {
    const now = dayjs();
    const INSPECTION_HOURS = 12;
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
      {/* Loại xuất bán */}
      <span className="font-semibold">Loại xuất: Xuất bán</span>
      <div className="mb-2"></div>

      {/* Hiển thị thông báo nếu data được load từ Excel */}
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
              <span className="font-bold text-red-800">12h</span> kiểm đếm.
            </div>
          )}
        </div>

        {/* Hạn kiểm đếm dự kiến - CHỈ HIỂN THỊ KHI ĐÃ CHỌN NGÀY XUẤT */}

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

      {/* Lí do xuất */}
      <div className="mb-4">
        <label className="block mb-1">
          Lí do xuất <span className="text-red-500">*</span>
          {excelFormData?.exportReason && (
            <span className="text-blue-500 text-xs ml-1">(từ Excel)</span>
          )}
        </label>
        <Input.TextArea
          value={formData.exportReason || ""}
          placeholder="Nhập lí do xuất"
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

      {/* Người nhận */}
      <div className="mb-4">
        <label className="block mb-1">
          Người nhận <span className="text-red-500">*</span>
          {excelFormData?.receiverName && (
            <span className="text-blue-500 text-xs ml-1">(từ Excel)</span>
          )}
        </label>
        <Input
          value={formData.receiverName || ""}
          placeholder="Nhập tên người nhận"
          onChange={(e) =>
            setFormData({ ...formData, receiverName: e.target.value })
          }
          className="w-full"
        />
        {!formData.receiverName && (
          <div className="text-red-500 text-xs mt-1">
            Vui lòng nhập tên người nhận.
          </div>
        )}
      </div>

      {/* Số điện thoại người nhận */}
      <div className="mb-4">
        <label className="block mb-1">
          Số điện thoại người nhận <span className="text-red-500">*</span>
          {excelFormData?.receiverPhone && (
            <span className="text-blue-500 text-xs ml-1">(từ Excel)</span>
          )}
        </label>
        <Input
          value={formData.receiverPhone || ""}
          placeholder="Nhập số điện thoại người nhận"
          onChange={(e) =>
            setFormData({ ...formData, receiverPhone: e.target.value })
          }
          className="w-full"
        />
        {formData.receiverPhone === "" && (
          <div className="text-red-500 text-xs mt-1">
            Vui lòng nhập số điện thoại người nhận.
          </div>
        )}
        {formData.receiverPhone &&
          !/^(\+84|0)(3|5|7|8|9)\d{8}$/.test(formData.receiverPhone) && (
            <div className="text-red-500 text-xs mt-1">
              Số điện thoại không hợp lệ. Vui lòng nhập theo dạng +84xxxxxxxxx
              hoặc 0xxxxxxxxx.
            </div>
          )}
      </div>

      {/* Địa chỉ người nhận */}
      <div className="mb-4">
        <label className="block mb-1">
          Địa chỉ người nhận
          {excelFormData?.receiverAddress && (
            <span className="text-blue-500 text-xs ml-1">(từ Excel)</span>
          )}
        </label>
        <Input
          value={formData.receiverAddress || ""}
          placeholder="Nhập địa chỉ người nhận (không bắt buộc)"
          onChange={(e) =>
            setFormData({ ...formData, receiverAddress: e.target.value })
          }
          className="w-full"
        />
      </div>
    </>
  );
};

SellingExportForm.propTypes = {
  formData: PropTypes.shape({
    exportDate: PropTypes.string,
    exportReason: PropTypes.string,
    receiverName: PropTypes.string,
    receiverPhone: PropTypes.string,
    receiverAddress: PropTypes.string,
    exportType: PropTypes.string,
    inspectionDateTime: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  mandatoryError: PropTypes.string,
  setMandatoryError: PropTypes.func,
  excelFormData: PropTypes.shape({
    exportReason: PropTypes.string,
    receiverName: PropTypes.string,
    receiverPhone: PropTypes.string,
    receiverAddress: PropTypes.string,
  }),
};

export default SellingExportForm;
