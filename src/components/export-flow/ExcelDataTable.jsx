import React from "react";
import { Table } from "antd";

const ExcelDataTable = ({ data }) => {
  const columns = [
    {
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
  ];
  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey={(record, index) => index}
      pagination={{ pageSize: 10 }}
      className="custom-table"
    />
  );
};

import PropTypes from "prop-types";

ExcelDataTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
};
export default ExcelDataTable;
