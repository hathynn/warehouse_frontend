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
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Quy cách", // cột measurementValue
      dataIndex: "measurementValue",
      key: "measurementValue",
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey={(record, index) => index}
      pagination={{ pageSize: 10 }}
    />
  );
};

import PropTypes from "prop-types";

ExcelDataTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.string,
      itemName: PropTypes.string,
      quantity: PropTypes.number,
    })
  ).isRequired,
};
export default ExcelDataTable;
