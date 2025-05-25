import React from "react";
import { Input, DatePicker } from "antd";
import moment from "moment";
import PropTypes from "prop-types";

const UseExportForm = ({
  formData,
  setFormData,
  openDepartmentModal,
  timeError,
  setTimeError,
  mandatoryError,
  setMandatoryError,
}) => {
  // Kiểm tra giờ nhận
  const checkTimeValid = (dateString, timeString) => {
    if (!dateString || !timeString) {
      setTimeError("");
      return;
    }
    const selected = moment(
      `${dateString} ${timeString}`,
      "YYYY-MM-DD HH:mm:ss"
    );
    const now = moment();
    const diff = selected.diff(now, "hours", true);
    if (diff < 6) {
      setTimeError(
        "Thời gian nhận phải lớn hơn thời điểm hiện tại ít nhất 6 giờ"
      );
    } else {
      setTimeError("");
    }
  };

  // Chặn nhập quá 150 ký tự
  const handleReasonChange = (e) => {
    const value = e.target.value;
    if (value.length <= 150) {
      setFormData({ ...formData, exportReason: value });
      setMandatoryError(""); // clear lỗi khi bắt đầu nhập
    }
  };

  return (
    <>
      {/* Ngày nhận và Thời gian nhận */}
      <span className="font-semibold">Loại xuất: Sản Xuất</span>
      <div className="mb-2"></div>
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block mb-1">
            Ngày nhận <span className="text-red-500">*</span>
          </label>
          <DatePicker
            format="DD-MM-YYYY" // vẫn giữ để người dùng thấy định dạng này
            onChange={(date) => {
              const newDate = date?.isValid()
                ? date.format("YYYY-MM-DD")
                : null; // 👈 đổi chỗ này
              setFormData({ ...formData, exportDate: newDate });
              setMandatoryError("");
              if (newDate && formData.exportTime) {
                checkTimeValid(newDate, formData.exportTime);
              }
            }}
            className="w-full"
            allowClear
            placeholder="Chọn ngày nhận"
          />
          {!formData.exportDate && (
            <div className="text-red-500 text-xs mt-1">
              Vui lòng chọn ngày nhận.
            </div>
          )}
        </div>
        <div className="flex-1">
          <label className="block mb-1">
            Thời gian nhận <span className="text-red-500">*</span>
          </label>
          <DatePicker
            picker="time"
            format="HH:mm"
            value={
              formData.exportTime ? moment(formData.exportTime, "HH:mm") : null
            }
            onChange={(time, timeString) => {
              setFormData({ ...formData, exportTime: timeString || null });
              setMandatoryError("");
              checkTimeValid(formData.exportDate, timeString);
            }}
            className="w-full"
            allowClear
            placeholder="Chọn thời gian nhận"
          />
          {!formData.exportTime && (
            <div className="text-red-500 text-xs mt-1">
              Vui lòng chọn thời gian nhận.
            </div>
          )}
          {timeError && (
            <div className="text-red-500 text-xs mt-1">{timeError}</div>
          )}
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
    exportTime: PropTypes.string,
    receivingDepartment: PropTypes.object,
    departmentRepresentative: PropTypes.string,
    departmentRepresentativePhone: PropTypes.string,
    note: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  openDepartmentModal: PropTypes.func.isRequired,
  timeError: PropTypes.string,
  setTimeError: PropTypes.func,
  mandatoryError: PropTypes.string,
  setMandatoryError: PropTypes.func,
};

export default UseExportForm;
