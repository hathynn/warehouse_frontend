import React from "react";
import { Table } from "antd";
import PropTypes from "prop-types";
import { InfoCircleFilled } from "@ant-design/icons";

/**
 * Gộp số lượng các dòng có cùng itemId & providerId
 */
function getConsolidatedData(data = []) {
  const grouped = {};
  data.forEach((row) => {
    // Nếu không có providerId (với các loại xuất không phải RETURN) thì chỉ group theo itemId
    const key = row.providerId
      ? `${row.itemId}-${row.providerId}`
      : `${row.itemId}`;
    if (grouped[key]) {
      grouped[key] = {
        ...grouped[key],
        quantity:
          Number(grouped[key].quantity || 0) + Number(row.quantity || 0),
      };
    } else {
      grouped[key] = { ...row };
    }
  });
  return Object.values(grouped);
}

/**
 * Hàm tính rowSpan cho cell gộp (khu nhà cung cấp)
 */
function calculateRowSpanForItemHaveSameCompareValue(data, field, idx) {
  if (!Array.isArray(data) || data.length === 0) return 1;
  const curValue = data[idx]?.[field];
  // Nếu không phải dòng đầu tiên của một nhóm => rowSpan = 0 (ẩn)
  if (idx > 0 && data[idx - 1]?.[field] === curValue) return 0;
  // Tính số dòng liên tiếp cùng value
  let rowSpan = 1;
  for (let i = idx + 1; i < data.length; ++i) {
    if (data[i][field] === curValue) rowSpan++;
    else break;
  }
  return rowSpan;
}

const ExcelDataTableAfter = ({
  data,
  exportType,
  items = [],
  providers = [],
  pagination = { pageSize: 10 },
}) => {
  // Helper để lấy tên nhà cung cấp từ providerId (nếu có)
  const getProviderName = (record) => {
    if (!record.providerId) return "";
    const foundProvider = providers.find(
      (p) => String(p.id) === String(record.providerId)
    );
    return foundProvider?.name || record.providerName || "";
  };

  // Helper lấy tên item (nếu thiếu trong record)
  const getItemName = (record) => {
    return (
      record.itemName ||
      items.find((i) => String(i.id) === String(record.itemId))?.name ||
      "Không xác định"
    );
  };

  // Helper lấy đơn vị tính, giá trị đo lường
  const getUnit = (record) => {
    return (
      record.measurementUnit ||
      items.find((i) => String(i.id) === String(record.itemId))
        ?.measurementUnit ||
      ""
    );
  };

  const getTotalMeasurementValue = (record) => {
    return (
      record.totalMeasurementValue ||
      items.find((i) => String(i.id) === String(record.itemId))
        ?.totalMeasurementValue ||
      0
    );
  };

  // 1. Sort data trước nếu là RETURN (chú ý getProviderName phải khai báo phía trên)
  const sortedData = React.useMemo(() => {
    const arr = [...data];
    if (exportType === "RETURN") {
      arr.sort((a, b) => {
        const pa = getProviderName(a) || "";
        const pb = getProviderName(b) || "";
        if (pa < pb) return -1;
        if (pa > pb) return 1;
        // Bạn có thể thêm sort theo tên hàng nếu muốn:
        const ia = getItemName(a) || "";
        const ib = getItemName(b) || "";
        return ia.localeCompare(ib);
      });
    }
    return arr;
  }, [data, exportType, providers, items]);

  // 2. Gộp sau khi đã sort xong
  const consolidatedData = React.useMemo(
    () => getConsolidatedData(sortedData),
    [sortedData]
  );

  // Cột động giống logic ExcelDataTable
  const columns = [
    {
      width: "10%",
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      render: (text) => <div>{text}</div>,
    },
    {
      width: "12%",
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
      render: (_, record) => <span>{getItemName(record)}</span>,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: "9%",
      render: (text) => (
        <div style={{ textAlign: "right", paddingLeft: 12 }}>{text}</div>
      ),
    },
    {
      title: "Giá trị đo lường",
      dataIndex: "totalMeasurementValue",
      key: "totalMeasurementValue",
      width: "12%",
      render: (_, record) => (
        <div style={{ textAlign: "right", paddingLeft: 12 }}>
          {getTotalMeasurementValue(record)}
        </div>
      ),
    },
    {
      width: "9%",
      title: "Đơn vị tính",
      dataIndex: "measurementUnit",
      key: "measurementUnit",
      render: (_, record) => <span>{getUnit(record)}</span>,
    },
    // Quy cách cho các loại này
    ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(exportType)
      ? {
          title: "Quy cách",
          dataIndex: "measurementValue",
          key: "measurementValue",
          render: (text) => <span>{text || ""}</span>,
        }
      : null,
    // Nhà cung cấp cho RETURN
    exportType === "RETURN"
      ? {
          width: "25%",
          title: "Nhà cung cấp",
          dataIndex: "providerName",
          key: "providerName",
          render: (_, record) => <span>{getProviderName(record)}</span>,
          onCell: (record, idx) => ({
            rowSpan: calculateRowSpanForItemHaveSameCompareValue(
              consolidatedData,
              "providerName",
              idx
            ),
          }),
        }
      : null,
  ].filter(Boolean);

  return (
    <>
      {/* Thông tin xuất kho */}
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
          Thông tin xuất kho
        </div>
        <div style={{ marginTop: 4 }}>
          Tổng số mặt hàng xuất: {consolidatedData.length}
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={consolidatedData}
        rowKey={(record, idx) =>
          exportType === "RETURN"
            ? `${record.itemId}-${record.providerId}-${idx}`
            : String(record.itemId)
        }
        pagination={pagination}
      />
    </>
  );
};

ExcelDataTableAfter.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      itemName: PropTypes.string,
      quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      measurementValue: PropTypes.string,
      providerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      providerName: PropTypes.string,
      measurementUnit: PropTypes.string,
      totalMeasurementValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
    })
  ).isRequired,
  exportType: PropTypes.string.isRequired,
  items: PropTypes.array,
  providers: PropTypes.array,
  pagination: PropTypes.object,
};

export default ExcelDataTableAfter;
