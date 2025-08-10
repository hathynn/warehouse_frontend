import React, { useEffect } from "react";
import { Table } from "antd";
import PropTypes from "prop-types";
import { InfoCircleFilled } from "@ant-design/icons";

const ExcelDataTable = ({
  data,
  onDataChange,
  items,
  onTableErrorChange,
  pagination,
  onPaginationChange,
  setPagination,
}) => {
  // Reset states when data changes completely
  useEffect(() => {
    if (onTableErrorChange) {
      onTableErrorChange(false);
    }
  }, [onTableErrorChange]);

  const columns = [
    {
      width: "15%",
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      render: (text) => <div>{text}</div>,
    },
    {
      width: "18%",
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      width: "17%",
      title: <span className="font-semibold">Quy cách</span>,
      dataIndex: "measurementValue",
      key: "measurementValue",
      align: "center",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (_, record) => {
        const itemMeta = items.find(
          (i) => String(i.id) === String(record.itemId)
        );
        const measurementValueFromDB = itemMeta?.measurementValue || "";

        return (
          <span>
            <strong style={{ fontSize: "17px" }}>
              {measurementValueFromDB}
            </strong>{" "}
            {record.measurementUnit} / {record.unitType}
          </span>
        );
      },
    },
    {
      width: "22%",
      title: <span className="font-semibold">Tổng số lượng khả dụng</span>,
      dataIndex: "numberOfAvailableItems",
      key: "numberOfAvailableItems",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (text, record) => (
        <span style={{ display: "block", textAlign: "center" }}>
          <strong style={{ fontSize: "17px" }}>{text}</strong> {record.unitType}
        </span>
      ),
    },
    {
      width: "20%",
      title: <span className="font-semibold">Tổng giá trị khả dụng</span>,
      dataIndex: "numberOfAvailableMeasurementValues",
      key: "numberOfAvailableMeasurementValues",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (text, record) => (
        <span style={{ display: "block", textAlign: "center" }}>
          <strong style={{ fontSize: "17px" }}>{text}</strong>{" "}
          {record.measurementUnit}
        </span>
      ),
    },
  ];

  return (
    <>
      {/* Thông tin kiểm kho */}
      <div
        style={{
          backgroundColor: "#e6f7ff",
          border: "1px solid #91d5ff",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          <InfoCircleFilled
            style={{ color: "#1677ff", fontSize: 22, marginRight: 8 }}
          />
          Thông tin kiểm kho
        </div>
        <div style={{ marginTop: 4 }}>
          Tổng số mặt hàng yêu cầu kiểm kho: {data.length}
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record) => String(record?.itemId)}
        pagination={pagination.total > pagination.pageSize ? pagination : false}
        onChange={onPaginationChange}
        rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-100" : "")}
        components={{
          body: {
            row: ({ children, ...restProps }) => (
              <tr {...restProps} id={`row-${restProps["data-row-key"]}`}>
                {children}
              </tr>
            ),
          },
        }}
      />
    </>
  );
};

ExcelDataTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      itemName: PropTypes.string,
      unitType: PropTypes.string,
      measurementUnit: PropTypes.string,
      totalMeasurementValue: PropTypes.string,
    })
  ).isRequired,
  onDataChange: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
  onTableErrorChange: PropTypes.func,
  pagination: PropTypes.object,
  onPaginationChange: PropTypes.func,
  setPagination: PropTypes.func,
};

export default ExcelDataTable;
