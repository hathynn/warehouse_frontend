import React from "react";
import { Input, DatePicker, Select, Row, Col } from "antd";
import moment from "moment";
import PropTypes from "prop-types";

const { Option } = Select;

const LoanExportForm = ({ formData, setFormData, openDepartmentModal }) => {
  // Handle switching loan types and clear fields not applicable
  const handleLoanTypeChange = (value) => {
    setFormData({
      ...formData,
      loanType: value,
      // For INTERNAL, clear external fields; for EXTERNAL, clear internal fields.
      receivingDepartment:
        value === "INTERNAL" ? formData.receivingDepartment : null,
      departmentRepresentative:
        value === "INTERNAL" ? formData.departmentRepresentative : "",
      departmentRepresentativePhone:
        value === "INTERNAL" ? formData.departmentRepresentativePhone : "",
      borrowerName: value === "EXTERNAL" ? "" : formData.borrowerName,
      borrowerPhone: value === "EXTERNAL" ? "" : formData.borrowerPhone,
      borrowerAddress: value === "EXTERNAL" ? "" : formData.borrowerAddress,
    });
  };

  return (
    <>
      <span className="font-semibold">Loại xuất: Mượn</span>
      <div className="mb-2"></div>
      {/* Row 1: Loan Type & Return Date */}
      <Row gutter={16} className="mb-4">
        <Col span={12}>
          <label className="block mb-1">
            Loại xuất mượn <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.loanType}
            onChange={handleLoanTypeChange}
            className="w-full"
          >
            <Option value="INTERNAL">Xuất mượn nội bộ</Option>
            <Option value="EXTERNAL">Xuất mượn bên ngoài</Option>
          </Select>
        </Col>
        <Col span={12}>
          <label className="block mb-1">
            Ngày trả <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={formData.returnDate ? moment(formData.returnDate) : null}
            onChange={(date, dateString) =>
              setFormData({ ...formData, returnDate: dateString })
            }
            className="w-full"
          />
        </Col>
      </Row>

      {/* Row 2: Export Date & Export Time */}
      <Row gutter={16} className="mb-4">
        <Col span={12}>
          <label className="block mb-1">
            Ngày xuất <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={formData.exportDate ? moment(formData.exportDate) : null}
            onChange={(date, dateString) =>
              setFormData({ ...formData, exportDate: dateString })
            }
            className="w-full"
          />
        </Col>
        <Col span={12}>
          <label className="block mb-1">
            Thời gian xuất <span className="text-red-500">*</span>
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
        </Col>
      </Row>

      {formData.loanType === "INTERNAL" && (
        <>
          {/* Row 3: Department selection */}
          <Row gutter={16} className="mb-4">
            <Col span={24}>
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
            </Col>
          </Row>
          {/* Row 4: Department Representative & Phone */}
          <Row gutter={16} className="mb-4">
            <Col span={12}>
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
            </Col>
            <Col span={12}>
              <label className="block mb-1">Số điện thoại</label>
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
            </Col>
          </Row>
        </>
      )}

      {formData.loanType === "EXTERNAL" && (
        <>
          {/* Row 3: Borrower Name & Phone */}
          <Row gutter={16} className="mb-4">
            <Col span={12}>
              <label className="block mb-1">
                Tên công ty/Người mượn <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.borrowerName || ""}
                placeholder="Nhập tên công ty hoặc người mượn"
                onChange={(e) =>
                  setFormData({ ...formData, borrowerName: e.target.value })
                }
                className="w-full"
              />
            </Col>
            <Col span={12}>
              <label className="block mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.borrowerPhone || ""}
                placeholder="Nhập số điện thoại"
                onChange={(e) =>
                  setFormData({ ...formData, borrowerPhone: e.target.value })
                }
                className="w-full"
              />
            </Col>
          </Row>
          {/* Row 4: Borrower Address */}
          <Row gutter={16} className="mb-4">
            <Col span={24}>
              <label className="block mb-1">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.borrowerAddress || ""}
                placeholder="Nhập địa chỉ"
                onChange={(e) =>
                  setFormData({ ...formData, borrowerAddress: e.target.value })
                }
                className="w-full"
              />
            </Col>
          </Row>
        </>
      )}

      {/* Row 5: Loan Reason */}
      <Row gutter={16} className="mb-4">
        <Col span={24}>
          <label className="block mb-1">
            Lí do <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.loanReason || ""}
            placeholder="Nhập lí do mượn"
            onChange={(e) =>
              setFormData({ ...formData, loanReason: e.target.value })
            }
            className="w-full"
          />
        </Col>
      </Row>

      {/* Row 6: Note
      <Row gutter={16} className="mb-4">
        <Col span={24}>
          <label className="block mb-1">Ghi chú</label>
          <Input.TextArea
            rows={3}
            value={formData.note || ""}
            placeholder="Nhập ghi chú (nếu có)"
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="w-full"
          />
        </Col>
      </Row> */}
    </>
  );
};

LoanExportForm.propTypes = {
  formData: PropTypes.shape({
    loanType: PropTypes.string, // "INTERNAL" or "EXTERNAL"
    exportDate: PropTypes.string,
    exportTime: PropTypes.string,
    receivingDepartment: PropTypes.object,
    departmentRepresentative: PropTypes.string,
    departmentRepresentativePhone: PropTypes.string,
    borrowerName: PropTypes.string,
    borrowerPhone: PropTypes.string,
    borrowerAddress: PropTypes.string,
    returnDate: PropTypes.string,
    loanReason: PropTypes.string,
    note: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  openDepartmentModal: PropTypes.func.isRequired,
};

export default LoanExportForm;
