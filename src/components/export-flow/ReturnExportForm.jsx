import React from "react";
import { Input, DatePicker } from "antd";
import moment from "moment";

const ReturnExportForm = ({
  formData,
  setFormData,
  openSupplierModal,
  openReturnManagerModal,
  openImportReferenceModal,
}) => {
  return (
    <>
      <div>
        <label className="block mb-1">
          Ngày dự xuất <span className="text-red-500">*</span>
        </label>
        <DatePicker
          value={formData.exportDate ? moment(formData.exportDate) : null}
          onChange={(date, dateString) =>
            setFormData({ ...formData, exportDate: dateString })
          }
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1">
          Nhà cung cấp nhận hàng trả về <span className="text-red-500">*</span>
        </label>
        <Input
          readOnly
          value={
            formData.supplierReceiver ? formData.supplierReceiver.name : ""
          }
          placeholder="Chọn nhà cung cấp"
          onClick={openSupplierModal}
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1">
          Người phụ trách việc trả hàng <span className="text-red-500">*</span>
        </label>
        <Input
          readOnly
          value={formData.returnManager ? formData.returnManager.name : ""}
          placeholder="Chọn người phụ trách"
          onClick={openReturnManagerModal}
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1">
          Phiếu nhập tham chiếu <span className="text-red-500">*</span>
        </label>
        <Input
          readOnly
          value={formData.importReference ? formData.importReference.name : ""}
          placeholder="Chọn phiếu nhập"
          onClick={openImportReferenceModal}
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1">
          Lý do trả hàng <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.returnReason}
          onChange={(e) =>
            setFormData({ ...formData, returnReason: e.target.value })
          }
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1">Ghi chú</label>
        <Input.TextArea
          rows={3}
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          className="w-full"
        />
      </div>
    </>
  );
};

import PropTypes from "prop-types";

ReturnExportForm.propTypes = {
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  openSupplierModal: PropTypes.func.isRequired,
  openReturnManagerModal: PropTypes.func.isRequired,
  openImportReferenceModal: PropTypes.func.isRequired,
};
export default ReturnExportForm;
