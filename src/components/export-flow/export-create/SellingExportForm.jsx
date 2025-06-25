import React, { useEffect, useState } from "react";
import { Input, DatePicker } from "antd";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import useConfigurationService from "@/services/useConfigurationService"; // Cập nhật đường dẫn cho đúng

const SellingExportForm = ({
  formData,
  setFormData,
  mandatoryError,
  setMandatoryError,
  excelFormData, // THÊM PROP NÀY ĐỂ NHẬN DATA TỪ EXCEL
}) => {
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
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

  useEffect(() => {
    // CHỈ AUTO-FILL 1 LẦN DUY NHẤT KHI CÓ EXCEL DATA VÀ CHƯA AUTO-FILL
    if (excelFormData && !hasAutoFilled) {
      console.log("Auto-filling from Excel data:", excelFormData);

      setFormData((prev) => ({
        ...prev,
        // CHỈ FILL NỀU FIELD ĐANG TRỐNG
        exportReason: prev.exportReason || excelFormData.exportReason || "",
        receiverName: prev.receiverName || excelFormData.receiverName || "",
        receiverPhone: prev.receiverPhone || excelFormData.receiverPhone || "",
        receiverAddress:
          prev.receiverAddress || excelFormData.receiverAddress || "",
      }));

      setHasAutoFilled(true); // ĐÁNH DẤU ĐÃ AUTO-FILL
    }
  }, [excelFormData, hasAutoFilled]); // BỎ setFormData khỏi dependency

  // RESET FLAG KHI EXPORT TYPE THAY ĐỔI
  useEffect(() => {
    setHasAutoFilled(false);
  }, [formData.exportType]);

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
    const INSPECTION_HOURS = 24;

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
    return calculationTime.startOf("day");
  };

  // Disable các ngày trước ngày xuất sớm nhất được phép
  const getDisabledDate = (current) => {
    if (!current) return false;

    const minExportDate = calculateMinExportDate();
    return current.isBefore(minExportDate);
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

      {/* Ngày xuất */}
      <div className="mb-4">
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
            setMandatoryError("");
          }}
          className="w-full"
          allowClear
          placeholder="Chọn ngày xuất"
          disabledDate={getDisabledDate}
        />
        {!formData.exportDate && (
          <div className="text-red-500 text-xs mt-1">
            Vui lòng chọn ngày xuất (tối thiểu sau 24h kiểm đếm trong giờ hành
            chính).
          </div>
        )}
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
        {!formData.receiverPhone && (
          <div className="text-red-500 text-xs mt-1">
            Vui lòng nhập số điện thoại người nhận.
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
