import React from "react";
import { Input, DatePicker } from "antd";
import moment from "moment";

const LoanExportForm = ({ formData, setFormData, openLoanManagerModal }) => {
  return (
    <>
      <div>
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
      </div>
      <div>
        <label className="block mb-1">
          Người/Bộ phận mượn hàng <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.borrower}
          onChange={(e) =>
            setFormData({ ...formData, borrower: e.target.value })
          }
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1">
          Người phụ trách <span className="text-red-500">*</span>
        </label>
        <Input
          readOnly
          value={formData.loanManager ? formData.loanManager.name : ""}
          placeholder="Chọn người phụ trách"
          onClick={openLoanManagerModal}
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1">
          Thời hạn mượn <span className="text-red-500">*</span>
        </label>
        <DatePicker
          value={formData.loanExpiry ? moment(formData.loanExpiry) : null}
          onChange={(date, dateString) =>
            setFormData({ ...formData, loanExpiry: dateString })
          }
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1">
          Lý do mượn hàng <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.loanReason}
          onChange={(e) =>
            setFormData({ ...formData, loanReason: e.target.value })
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

LoanExportForm.propTypes = {
  formData: PropTypes.shape({
    exportDate: PropTypes.string,
    borrower: PropTypes.string,
    loanManager: PropTypes.shape({
      name: PropTypes.string,
    }),
    loanExpiry: PropTypes.string,
    loanReason: PropTypes.string,
    note: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  openLoanManagerModal: PropTypes.func.isRequired,
};
export default LoanExportForm;
