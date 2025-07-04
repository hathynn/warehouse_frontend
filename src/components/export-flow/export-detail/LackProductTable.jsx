// LackProductTable.jsx
import React from "react";
import { Table } from "antd";

const LackProductTable = ({ data }) => {
  const columns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      render: (id) => `#${id}`,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "itemName",
      key: "itemName",
      ellipsis: true,
    },
    {
      title: "Số lượng cần",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      render: (text) => (
        <span className="text-black font-semibold" style={{ float: "right" }}>
          {text}
        </span>
      ),
    },
    {
      title: "Số lượng đã đóng gói",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      render: (text) => (
        <span className="text-red-600 font-semibold" style={{ float: "right" }}>
          {text}
        </span>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      size="small"
      style={{ height: "420px", overflowY: "auto" }}
    />
  );
};

export default LackProductTable;
