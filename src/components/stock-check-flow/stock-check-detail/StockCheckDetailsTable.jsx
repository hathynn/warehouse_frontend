import React, { useState } from "react";
import { Table, Card, Tag, Button, Checkbox } from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import { AccountRole } from "@/utils/enums";

const StockCheckDetailsTable = ({
  stockCheckDetails,
  stockCheckDetailLoading,
  pagination,
  onTableChange,
  inventoryItems,
  inventoryItemsLoading,
  getStockCheckDetailByDetailId,
  userRole,
  stockCheckStatus,
  selectedDetailIds,
  onSelectDetail,
  onSelectAllDetails,
  allDetailIds,
}) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [expandedPagination, setExpandedPagination] = useState({});
  const [expandedRowData, setExpandedRowData] = useState({});

  // Handle expand/collapse
  const handleExpand = async (expanded, record) => {
    if (expanded) {
      // Fetch data for this row if not already fetched
      if (!expandedRowData[record.id]) {
        try {
          const response = await getStockCheckDetailByDetailId(record.id);
          if (response) {
            setExpandedRowData((prev) => ({
              ...prev,
              [record.id]: {
                inventoryItemIds: response.inventoryItemIds || [],
                checkedInventoryItemIds: response.checkedInventoryItemIds || [],
              },
            }));
          }
        } catch (error) {
          console.error("Error fetching inventory detail:", error);
        }
      }

      setExpandedRowKeys([...expandedRowKeys, record.id]);

      // Initialize pagination for this expanded row
      if (!expandedPagination[record.id]) {
        setExpandedPagination((prev) => ({
          ...prev,
          [record.id]: { current: 1, pageSize: 10 },
        }));
      }
    } else {
      setExpandedRowKeys(expandedRowKeys.filter((key) => key !== record.id));
    }
  };

  // Handle pagination change for expanded content
  const handleExpandedPaginationChange = (recordId, page, pageSize) => {
    setExpandedPagination((prev) => ({
      ...prev,
      [recordId]: { current: page, pageSize: pageSize || 10 },
    }));
  };

  // Render expanded content
  const renderExpandedRow = (record) => {
    const rowData = expandedRowData[record.id];
    if (
      !rowData ||
      !rowData.inventoryItemIds ||
      rowData.inventoryItemIds.length === 0
    ) {
      return (
        <div style={{ padding: "16px", textAlign: "center", color: "#999" }}>
          Không có dữ liệu
        </div>
      );
    }

    const { inventoryItemIds, checkedInventoryItemIds } = rowData;

    // Find inventory items that belong to this record's itemId
    const recordInventoryItems = inventoryItems.filter(
      (item) =>
        inventoryItemIds.includes(item.id) && item.itemId === record.itemId
    );

    // Sort items by measurementValue first
    const sortedItems = [...recordInventoryItems].sort((a, b) => {
      const valA = a.measurementValue || 0;
      const valB = b.measurementValue || 0;
      return valA - valB;
    });

    // Group ALL items by measurementValue BEFORE pagination
    const groupedByMeasurement = {};
    sortedItems.forEach((item) => {
      const measurementValue = item.measurementValue || 0;
      if (!groupedByMeasurement[measurementValue]) {
        groupedByMeasurement[measurementValue] = [];
      }
      groupedByMeasurement[measurementValue].push(item);
    });

    // Create flat array with group information
    const allTableData = [];
    let groupIndex = 0;
    Object.entries(groupedByMeasurement)
      .sort(([a], [b]) => Number(a) - Number(b)) // Sort groups by measurement value
      .forEach(([measurementValue, items]) => {
        items.forEach((item, index) => {
          allTableData.push({
            key: item.id,
            measurementValue: measurementValue,
            inventoryItemId: item.id,
            isChecked: checkedInventoryItemIds.includes(item.id),
            groupSize: items.length,
            isFirstInGroup: index === 0,
            // Store original group info for proper rendering
            originalGroupSize: items.length,
            indexInGroup: index,
            groupIndex: groupIndex, // Add group index for row coloring
          });
        });
        groupIndex++;
      });

    const currentPagination = expandedPagination[record.id] || {
      current: 1,
      pageSize: 10,
    };

    // Apply pagination AFTER grouping
    const startIndex =
      (currentPagination.current - 1) * currentPagination.pageSize;
    const endIndex = startIndex + currentPagination.pageSize;
    const paginatedData = allTableData.slice(startIndex, endIndex);

    // Recalculate group spans for current page
    const tableData = paginatedData.map((item, idx) => {
      // Check if this is the first item of a group on this page
      const isFirstOnPage =
        idx === 0 ||
        paginatedData[idx - 1].measurementValue !== item.measurementValue;

      // Count how many items of this group are on this page
      let groupSizeOnPage = 1;
      if (isFirstOnPage) {
        for (let i = idx + 1; i < paginatedData.length; i++) {
          if (paginatedData[i].measurementValue === item.measurementValue) {
            groupSizeOnPage++;
          } else {
            break;
          }
        }
      }

      return {
        ...item,
        isFirstInGroup: isFirstOnPage,
        groupSize: isFirstOnPage ? groupSizeOnPage : 0,
        // Keep track of total items in original group for display
        totalInGroup: item.originalGroupSize,
        groupIndex: item.groupIndex, // Keep group index for row coloring
      };
    });

    const expandedColumns = [
      {
        title: "Quy cách",
        dataIndex: "measurementValue",
        key: "measurementValue",
        width: "30%",
        render: (value, item) => {
          if (!item.isFirstInGroup)
            return { children: null, props: { rowSpan: 0 } };

          return {
            children: (
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "16px",
                  color: "#1677ff",
                  textAlign: "center",
                }}
              >
                {value} {record.measurementUnit}
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    fontWeight: "normal",
                  }}
                >
                  ({item.totalInGroup} sản phẩm)
                </div>
              </div>
            ),
            props: { rowSpan: item.groupSize },
          };
        },
      },
      {
        title: "Mã sản phẩm tồn kho",
        dataIndex: "inventoryItemId",
        key: "inventoryItemId",
        width: "50%",
        render: (value) => (
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "14px",
              padding: "4px 8px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              border: "1px solid #d9d9d9",
            }}
          >
            {value}
          </div>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "isChecked",
        key: "isChecked",
        width: "20%",
        align: "center",
        render: (isChecked) => (
          <Tag color={isChecked ? "success" : "default"}>
            {isChecked ? "Đã kiểm" : "Chưa kiểm"}
          </Tag>
        ),
      },
    ];

    return (
      <div
        style={{
          margin: "16px 0",
          padding: "16px",
          backgroundColor: "#fafafa",
          borderRadius: "8px",
          border: "1px solid #e8e8e8",
        }}
      >
        <div
          style={{
            marginBottom: "12px",
            fontWeight: "600",
            color: "#1677ff",
            fontSize: "16px",
          }}
        >
          Danh sách sản phẩm tồn kho - {record.itemId}
        </div>

        <Table
          columns={expandedColumns}
          dataSource={tableData}
          pagination={{
            current: currentPagination.current,
            pageSize: currentPagination.pageSize,
            total: allTableData.length,
            showSizeChanger: true,
            showQuickJumper: false,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} sản phẩm`,
            onChange: (page, pageSize) =>
              handleExpandedPaginationChange(record.id, page, pageSize),
            size: "small",
          }}
          size="small"
          rowKey="key"
          style={{ backgroundColor: "white" }}
          bordered
          rowClassName={(record) => {
            // Alternate background color by group
            return record.groupIndex % 2 === 0 ? "" : "bg-gray-100";
          }}
        />
      </div>
    );
  };

  const baseColumns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      width: "18%",
      render: (id, record) => (
        <div>
          <span style={{ fontWeight: "bold", fontSize: "18px" }}>{id}</span>
          <div className="text-gray-500 mt-1" style={{ fontSize: "12px" }}>
            (Quy cách chuẩn: {record.standardMeasurementValue || "-"}{" "}
            {record.measurementUnit || ""}/{record.unitType || ""})
          </div>
        </div>
      ),
    },
    {
      title: "Số lượng cần kiểm",
      dataIndex: "quantity",
      key: "quantity",
      width: "15%",
      align: "center",
      render: (text, record) => (
        <div style={{ textAlign: "center" }}>
          <span style={{ fontWeight: "600", fontSize: "18px" }}>{text}</span>{" "}
          {record.unitType && (
            <span className="text-gray-500">{record.unitType}</span>
          )}
        </div>
      ),
    },
    {
      title: "Số lượng đã kiểm",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      width: "15%",
      align: "center",
      render: (text, record) => {
        const isLacking = text < record.quantity;
        const isExcess = text > record.quantity;

        return (
          <div style={{ textAlign: "center" }}>
            <span
              className={
                isLacking
                  ? "text-red-600 font-semibold"
                  : isExcess
                  ? "text-orange-600 font-semibold"
                  : "text-green-600 font-semibold"
              }
              style={{ fontSize: "18px" }}
            >
              {text}
            </span>{" "}
            {record.unitType && (
              <span className="text-gray-500">{record.unitType}</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Tổng giá trị đo lường",
      dataIndex: "measurementValue",
      key: "measurementValue",
      width: "15%",
      align: "center",
      render: (text, record) => (
        <div style={{ textAlign: "center" }}>
          <span style={{ fontWeight: "600", fontSize: "18px" }}>{text}</span>{" "}
          {record.measurementUnit && (
            <span className="text-gray-500">{record.measurementUnit}</span>
          )}
        </div>
      ),
    },
    {
      title: "Tổng giá trị đã kiểm",
      dataIndex: "actualMeasurementValue",
      key: "actualMeasurementValue",
      width: "20%",
      align: "center",
      render: (text, record) => {
        const isLacking = text < record.measurementValue;
        const isExcess = text > record.measurementValue;

        return (
          <div style={{ textAlign: "center" }}>
            <span
              className={
                isLacking
                  ? "text-red-600 font-semibold"
                  : isExcess
                  ? "text-orange-600 font-semibold"
                  : "text-green-600 font-semibold"
              }
              style={{ fontSize: "18px" }}
            >
              {text}
            </span>{" "}
            {record.measurementUnit && (
              <span className="text-gray-500">{record.measurementUnit}</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: "12%",
      align: "center",
      render: (status) => {
        if (!status) {
          return "-";
        }

        const statusConfig = {
          LACK: { color: "error", text: "Thiếu" },
          MATCH: { color: "success", text: "Đủ" },
          EXCESS: { color: "warning", text: "Thừa" },
        };

        const config = statusConfig[status];

        if (!config) {
          return status;
        }

        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  const checkboxColumn = {
    title: (
      <Checkbox
        checked={
          selectedDetailIds?.length === allDetailIds?.length &&
          allDetailIds?.length > 0
        }
        onChange={onSelectAllDetails}
      />
    ),
    width: "60px",
    render: (_, record) => (
      <Checkbox
        checked={selectedDetailIds?.includes(record.id)}
        onChange={(e) => onSelectDetail(record.id, e.target.checked)}
      />
    ),
  };

  const columns =
    userRole === AccountRole.MANAGER && stockCheckStatus === "COUNT_CONFIRMED"
      ? [checkboxColumn, ...baseColumns]
      : baseColumns;

  return (
    <Card className="mb-6 mt-4">
      <Table
        columns={columns}
        dataSource={stockCheckDetails}
        rowKey="id"
        loading={stockCheckDetailLoading || inventoryItemsLoading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} sản phẩm`,
        }}
        onChange={onTableChange}
        className="[&_.ant-table-cell]:!p-3"
        rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-100" : "")}
        expandable={{
          expandedRowKeys,
          onExpand: handleExpand,
          expandedRowRender: renderExpandedRow,
          expandIconColumnIndex: columns.length,
          expandIcon: ({ expanded, onExpand, record }) => (
            <Button
              type="text"
              size="small"
              icon={expanded ? <UpOutlined /> : <DownOutlined />}
              onClick={(e) => onExpand(record, e)}
              style={{
                color: "#1677ff",
                border: "1px solid #1677ff",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          ),
        }}
      />
    </Card>
  );
};

StockCheckDetailsTable.propTypes = {
  stockCheckDetails: PropTypes.array.isRequired,
  stockCheckDetailLoading: PropTypes.bool.isRequired,
  pagination: PropTypes.object.isRequired,
  onTableChange: PropTypes.func.isRequired,
  inventoryItems: PropTypes.array.isRequired,
  inventoryItemsLoading: PropTypes.bool.isRequired,
  getStockCheckDetailByDetailId: PropTypes.func.isRequired,
  userRole: PropTypes.string,
  stockCheckStatus: PropTypes.string,
  selectedDetailIds: PropTypes.array,
  onSelectDetail: PropTypes.func,
  onSelectAllDetails: PropTypes.func,
  allDetailIds: PropTypes.array,
};

export default StockCheckDetailsTable;
