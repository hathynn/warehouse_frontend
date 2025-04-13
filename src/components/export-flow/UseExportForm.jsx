import React from "react";
import { Input, DatePicker } from "antd";
import moment from "moment";
import PropTypes from "prop-types";

const UseExportForm = ({ formData, setFormData, openDepartmentModal }) => {
  UseExportForm.propTypes = {
    formData: PropTypes.shape({
      exportReason: PropTypes.string,
      exportDate: PropTypes.string,
      exportTime: PropTypes.string,
      receivingDepartment: PropTypes.object, // expected to have { id, name }
      departmentRepresentative: PropTypes.string,
      departmentRepresentativePhone: PropTypes.string,
      note: PropTypes.string,
      type: PropTypes.string, // luôn là "USE"
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    openDepartmentModal: PropTypes.func.isRequired,
  };

  return (
    <>
      {/* Ngày nhận và Thời gian nhận */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block mb-1">
            Ngày nhận <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={formData.exportDate ? moment(formData.exportDate) : null}
            onChange={(date, dateString) =>
              setFormData({ ...formData, exportDate: dateString })
            }
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <label className="block mb-1">
            Thời gian nhận <span className="text-red-500">*</span>
          </label>
          <DatePicker
            picker="time"
            format="HH:mm:ss"
            value={
              formData.exportTime
                ? moment(formData.exportTime, "HH:mm:ss")
                : null
            }
            onChange={(time, timeString) =>
              setFormData({ ...formData, exportTime: timeString })
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Lý do xuất */}
      <div className="mb-4">
        <label className="block mb-1">
          Lý do xuất <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.exportReason || ""}
          placeholder="Nhập lý do xuất"
          onChange={(e) =>
            setFormData({ ...formData, exportReason: e.target.value })
          }
          className="w-full"
        />
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
      </div>

      {/* Người đại diện phòng ban */}
      <div className="mb-4">
        <label className="block mb-1">Người đại diện phòng ban</label>
        <Input
          value={formData.departmentRepresentative || ""}
          placeholder="Tự động điền sau khi chọn phòng ban"
          readOnly
          className="w-full"
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
        />
      </div>

      {/* Field type ẩn */}
      <div className="mb-4" style={{ display: "none" }}>
        <Input value={formData.type || "USE"} readOnly />
      </div>

      {/* Ghi chú
      <div className="mb-4">
        <label className="block mb-1">Ghi chú</label>
        <Input.TextArea
          rows={3}
          value={formData.note || ""}
          placeholder="Nhập ghi chú (nếu có)"
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          className="w-full"
        />
      </div> */}
    </>
  );
};

export default UseExportForm;
