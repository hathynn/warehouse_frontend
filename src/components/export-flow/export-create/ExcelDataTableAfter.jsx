import React from "react";
import { Table } from "antd";
import PropTypes from "prop-types";
import { InfoCircleFilled } from "@ant-design/icons";

/**
 * Gộp số lượng/measurementValue các dòng có cùng itemId
 */
function getConsolidatedData(data = [], exportType) {
  const grouped = {};

  data.forEach((row) => {
    // Group theo itemId cho tất cả loại xuất
    const key = row.providerId
      ? `${row.itemId}-${row.providerId}`
      : `${row.itemId}`;

    if (grouped[key]) {
      // Cộng quantity cho SELLING và RETURN
      if (row.quantity !== undefined) {
        grouped[key].quantity =
          Number(grouped[key].quantity || 0) + Number(row.quantity || 0);
      }
      // Cộng measurementValue cho PRODUCTION, BORROWING, LIQUIDATION
      if (row.measurementValue !== undefined && row.measurementValue !== "") {
        grouped[key].measurementValue =
          (Number(grouped[key].measurementValue) || 0) +
          Number(row.measurementValue || 0);
      }
    } else {
      grouped[key] = {
        ...row,
        quantity:
          row.quantity !== undefined ? Number(row.quantity || 0) : undefined,
        measurementValue:
          row.measurementValue !== undefined
            ? Number(row.measurementValue || 0)
            : undefined,
      };
    }
  });

  return Object.values(grouped);
}

const ExcelDataTableAfter = ({
  data,
  exportType,
  items = [],
  providers = [],
  pagination = { pageSize: 10 },
  onPaginationChange,
}) => {
  // Helper lấy tên item
  const getItemName = (record) => {
    return (
      record.itemName ||
      items.find((i) => String(i.id) === String(record.itemId))?.name ||
      "Không xác định"
    );
  };

  // Helper lấy thông tin từ items metadata
  const getItemInfo = (record, field) => {
    const itemMeta = items.find((i) => String(i.id) === String(record.itemId));
    return record[field] || itemMeta?.[field] || "";
  };

  const consolidatedData = React.useMemo(
    () => getConsolidatedData(data, exportType),
    [data, exportType]
  );

  // Columns giống ExcelDataTable nhưng không có input
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
    // Cột Số lượng cho SELLING
    ["SELLING"].includes(exportType)
      ? {
          title: "Số lượng",
          dataIndex: "quantity",
          key: "quantity",
          align: "center",
          width: "9%",
          render: (text) => (
            <div style={{ textAlign: "right" }}>{text || 0}</div>
          ),
        }
      : null,
    // Cột Giá trị cần xuất cho PRODUCTION, BORROWING, LIQUIDATION
    ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(exportType)
      ? {
          title: "Giá trị cần xuất",
          dataIndex: "measurementValue",
          key: "measurementValue",
          align: "center",
          width: "9%",
          render: (text) => (
            <div style={{ textAlign: "right" }}>{text || 0}</div>
          ),
        }
      : null,
    // Cột Đơn vị tính cho SELLING
    ["SELLING"].includes(exportType)
      ? {
          width: "12%",
          title: <span className="font-semibold">Đơn vị tính</span>,
          dataIndex: "unitType",
          key: "unitType",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (_, record) => (
            <span style={{ display: "block", textAlign: "center" }}>
              {getItemInfo(record, "unitType")}
            </span>
          ),
        }
      : null,
    // Cột Đơn vị tính cho PRODUCTION, BORROWING, LIQUIDATION
    ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(exportType)
      ? {
          width: "12%",
          title: <span className="font-semibold">Đơn vị tính</span>,
          dataIndex: "measurementUnit",
          key: "measurementUnit",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (_, record) => (
            <span style={{ display: "block", textAlign: "center" }}>
              {getItemInfo(record, "measurementUnit")}
            </span>
          ),
        }
      : null,
    // Cột Quy cách - LẤY từ database metadata
    {
      width: "18%",
      title: <span className="font-semibold">Quy cách</span>,
      dataIndex: "unitType",
      key: "unitType",
      align: "center",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (_, record) => {
        // ✅ LẤY measurementValue từ item metadata (database), KHÔNG phải từ input
        const itemMeta = items.find(
          (i) => String(i.id) === String(record.itemId)
        );
        const measurementValueFromDB = itemMeta?.measurementValue || "";
        const measurementUnit = getItemInfo(record, "measurementUnit");
        const unitType = getItemInfo(record, "unitType");

        return (
          <span>
            {measurementValueFromDB} {measurementUnit} / {unitType}
          </span>
        );
      },
    },
    // Cột Nhà cung cấp cho RETURN
    exportType === "RETURN"
      ? {
          width: "35%",
          title: "Nhà cung cấp",
          dataIndex: "providerName",
          key: "providerName",
          render: (_, record) => {
            // Lấy provider name từ record hoặc providers array
            const providerName =
              record.providerName ||
              providers.find((p) => p.id === record.providerId)?.name ||
              "Không xác định";
            return <span>{providerName}</span>;
          },
        }
      : null,
  ].filter(Boolean);

  return (
    <>
      {/* Khối thông tin xuất kho - giống ExcelDataTable */}
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

      {/* Bảng dữ liệu - giống ExcelDataTable nhưng không có input */}
      <Table
        columns={columns}
        rowClassName={(_, index) => (index % 2 === 0 ? "bg-gray-100" : "")}
        dataSource={consolidatedData}
        rowKey={(record) => String(record?.itemId)}
        pagination={pagination.total > pagination.pageSize ? pagination : false}
        onChange={onPaginationChange}
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
      measurementValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      providerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      providerName: PropTypes.string,
      measurementUnit: PropTypes.string,
      unitType: PropTypes.string,
    })
  ).isRequired,
  exportType: PropTypes.string.isRequired,
  items: PropTypes.array,
  providers: PropTypes.array,
  pagination: PropTypes.object,
  onPaginationChange: PropTypes.func,
};

export default ExcelDataTableAfter;
