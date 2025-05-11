import React from "react";
import { Table } from "antd";

const ExcelDataTableAfter = ({ data }) => {
  const columns = [
    {
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      render: (text) => <div>#{text}</div>,
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
      render: (text) => <div className="pl-12">{text}</div>,
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

ExcelDataTableAfter.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.string,
      itemName: PropTypes.string,
      quantity: PropTypes.number,
    })
  ).isRequired,
};
export default ExcelDataTableAfter;
