import React from "react";
import { Table } from "antd";
import PropTypes from "prop-types";

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
      render: (text) => <div className="pl-12 text-right">{text}</div>,
    },
    {
      title: "Giá trị đo lường",
      dataIndex: "totalMeasurementValue",
      key: "totalMeasurementValue",
      render: (text) => <div className="pl-12 text-right">{text}</div>,
    },
    {
      title: "Đơn vị tính",
      dataIndex: "measurementUnit",
      key: "measurementUnit",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "Quy cách",
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

ExcelDataTableAfter.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      itemName: PropTypes.string,
      quantity: PropTypes.number,
      totalMeasurementValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      measurementUnit: PropTypes.string,
      measurementValue: PropTypes.string,
    })
  ).isRequired,
};

export default ExcelDataTableAfter;
