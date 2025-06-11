// ExportTypeSelector.jsx
import React from "react";
import { Space, Select } from "antd";
import PropTypes from "prop-types";

const { Option } = Select;

const ExportTypeSelector = ({ exportType, setExportType }) => (
  <Space direction="horizontal" className="mb-4">
    <span className="font-semibold text-base">Loại phiếu xuất: </span>
    <Select
      value={exportType}
      onChange={(value) => setExportType(value)}
      style={{ width: 300 }}
    >
      <Option value="SELLING">Xuất bán</Option>
      <Option value="RETURN">Xuất trả nhà cung cấp</Option>
      <Option value="PRODUCTION">Xuất sản xuất</Option>
      <Option value="BORROWING">Xuất mượn</Option>
      <Option value="LIQUIDATION">Xuất thanh lý</Option>
    </Select>
  </Space>
);

ExportTypeSelector.propTypes = {
  exportType: PropTypes.string.isRequired,
  setExportType: PropTypes.func.isRequired,
};
export default ExportTypeSelector;
