import React from "react";
import { Input, DatePicker } from "antd";
import moment from "moment";

import PropTypes from "prop-types";

const UseExportForm = ({ formData, setFormData, openDepartmentModal }) => {
  UseExportForm.propTypes = {
    formData: PropTypes.shape({
      exportDate: PropTypes.string,
      receivingDepartment: PropTypes.shape({
        name: PropTypes.string,
      }),
      receivingManager: PropTypes.string,
      productionOrder: PropTypes.string,
      usagePurpose: PropTypes.string,
      note: PropTypes.string,
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    openDepartmentModal: PropTypes.func.isRequired,
  };

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
          Bộ phận/phân xưởng sản xuất nhận hàng{" "}
          <span className="text-red-500">*</span>
        </label>
        <Input
          readOnly
          value={
            formData.receivingDepartment
              ? formData.receivingDepartment.name
              : ""
          }
          placeholder="Chọn bộ phận/phân xưởng"
          onClick={openDepartmentModal}
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1">
          Người phụ trách nhận hàng <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.receivingManager}
          onChange={(e) =>
            setFormData({ ...formData, receivingManager: e.target.value })
          }
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1">Lệnh sản xuất (nếu có)</label>
        <Input
          value={formData.productionOrder}
          onChange={(e) =>
            setFormData({ ...formData, productionOrder: e.target.value })
          }
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1">
          Mục đích sử dụng <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.usagePurpose}
          onChange={(e) =>
            setFormData({ ...formData, usagePurpose: e.target.value })
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
export default UseExportForm;
