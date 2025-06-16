import React from "react";
import { Input, DatePicker } from "antd";
import PropTypes from "prop-types";
import dayjs from "dayjs";

const ReturnExportForm = ({
  formData,
  setFormData,
  mandatoryError,
  setMandatoryError,
}) => {
  // Chặn nhập quá 150 ký tự cho lí do xuất
  const handleReasonChange = (e) => {
    const value = e.target.value;
    if (value.length <= 150) {
      setFormData({ ...formData, exportReason: value });
      setMandatoryError?.("");
    }
  };

  // Disable các ngày trong quá khứ
  const getDisabledDate = (current) => {
    return current && current.isBefore(dayjs().startOf("day"));
  };

  return (
    <>
      {/* Ngày xuất */}
      <div className="mb-4">
        <label className="block mb-1">
          Ngày nhận <span className="text-red-500">*</span>
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
