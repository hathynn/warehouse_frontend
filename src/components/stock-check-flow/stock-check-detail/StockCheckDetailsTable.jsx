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
  getStockCheckDetailByDetailId,
  userRole,
  stockCheckStatus,
  selectedDetailIds,
  onSelectDetail,
  onSelectAllDetails,
  allDetailIds,
  getInventoryItemsByItemId,
}) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [expandedPagination, setExpandedPagination] = useState({});
  const [expandedRowData, setExpandedRowData] = useState({});
  const [recordInventoryItems, setRecordInventoryItems] = useState({});

  // Handle expand/collapse
  const handleExpand = async (expanded, record) => {
    if (expanded) {
      // Fetch data for this row if not already fetched
      if (!expandedRowData[record.id]) {
        try {
          // Gọi API để lấy inventory items by itemId
          const [detailResponse, inventoryResponse] = await Promise.all([
            getStockCheckDetailByDetailId(record.id),
            getInventoryItemsByItemId(record.itemId),
          ]);

          if (detailResponse && inventoryResponse) {
            setExpandedRowData((prev) => ({
              ...prev,
              [record.id]: {
                inventoryItemIds: detailResponse.inventoryItemIds || [],
                checkedInventoryItemIds:
                  detailResponse.checkedInventoryItemIds || [],
              },
            }));

            // Lưu inventory items cho record này
            setRecordInventoryItems((prev) => ({
              ...prev,
              [record.id]: inventoryResponse.content || [],
            }));
          }
        } catch (error) {
          console.error("Error fetching inventory detail:", error);
        }
      }

      setExpandedRowKeys([...expandedRowKeys, record.id]);

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

  // Render expanded row for WAREHOUSE_MANAGER
  const renderWarehouseManagerExpandedRow = (record) => {
    const checkedInventoryItems = record.checkedInventoryItemIds || [];

    if (checkedInventoryItems.length === 0) {
      return (
        <div style={{ padding: "16px", textAlign: "center", color: "#999" }}>
          Không có hàng tồn kho được kiểm đếm cho mã sản phẩm này
        </div>
      );
    }

    const statusConfig = {
      AVAILABLE: { color: "success", text: "Có sẵn" },
      UNAVAILABLE: { color: "error", text: "Không có sẵn" },
      NEED_LIQUID: { color: "warning", text: "Thanh lý" },
      NO_LONGER_EXIST: { color: "default", text: "Không tồn tại" },
      READY_TO_STORE: { color: "default", text: "Chuẩn bị vô kho" },
      UNKNOWN: { color: "default", text: "Không xác định" },
    };

    const wmExpandedColumns = [
      {
        title: "Mã sản phẩm tồn kho đã kiểm",
        dataIndex: "inventoryItemId",
        key: "inventoryItemId",
        width: "40%",
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
        title: "Quy cách đo lường",
        dataIndex: "measurementValue",
        key: "measurementValue",
        width: "25%",
        align: "center",
        render: (value) => (
          <div style={{ textAlign: "center", fontWeight: "600" }}>
            {value || 0} {record.measurementUnit}
          </div>
        ),
      },
      {
        title: "Trạng thái kiểm kê",
        dataIndex: "status",
        key: "status",
        width: "35%",
        align: "center",
        render: (status) => {
          const config = statusConfig[status] || statusConfig.UNKNOWN;
          return <Tag color={config.color}>{config.text}</Tag>;
        },
      },
    ];

    // Create table data
    const tableData = checkedInventoryItems.map((item, index) => ({
      key: index,
      inventoryItemId: item.inventoryItemId,
      measurementValue: item.measurementValue,
      status: item.status,
    }));

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
          Danh sách sản phẩm tồn kho đã kiểm - {record.itemId}
        </div>

        <Table
          columns={wmExpandedColumns}
          dataSource={tableData}
          pagination={false}
          size="small"
          rowKey="key"
          style={{ backgroundColor: "white" }}
          bordered
          rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-100" : "")}
        />
      </div>
    );
  };

  const renderExpandedRow = (record) => {
    const rowData = expandedRowData[record.id];
    const inventoryItemsData = recordInventoryItems[record.id] || [];

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

    const { inventoryItemIds } = rowData;

    // Lấy checkedInventoryItemIds từ record gốc thay vì từ rowData
    const checkedInventoryItemIds = record.checkedInventoryItemIds || [];

    // Filter inventory items thuộc về record này
    const filteredInventoryItems = inventoryItemsData.filter((item) =>
      inventoryItemIds.includes(item.id)
    );

    // Sort items by measurementValue first
    const sortedItems = [...filteredInventoryItems].sort((a, b) => {
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
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([measurementValue, items]) => {
        items.forEach((item, index) => {
          allTableData.push({
            key: item.id,
            measurementValue: measurementValue,
            inventoryItemId: item.id,
            status: item.status, // Trạng thái trước kiểm
            isChecked: checkedInventoryItemIds.some(
              (checked) => checked.inventoryItemId === item.id
            ),
            groupSize: items.length,
            isFirstInGroup: index === 0,
            originalGroupSize: items.length,
            indexInGroup: index,
            groupIndex: groupIndex,
          });
        });
        groupIndex++;
      });

    // Phần còn lại của logic pagination giữ nguyên...
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
      const isFirstOnPage =
        idx === 0 ||
        paginatedData[idx - 1].measurementValue !== item.measurementValue;

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
        totalInGroup: item.originalGroupSize,
        groupIndex: item.groupIndex,
      };
    });

    // Render expanded content
    const expandedColumns = [
      {
        title: "Quy cách (trước kiểm)",
        dataIndex: "measurementValue",
        key: "measurementValue",
        align: "center",
        width: "20%",
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
        width: "25%",
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
      ...(stockCheckStatus !== "COMPLETED"
        ? [
            {
              title: "Trạng thái (trước kiểm)",
              dataIndex: "status",
              key: "status",
              width: "13%",
              align: "center",
              render: (status) => {
                const statusConfig = {
                  AVAILABLE: { color: "success", text: "Có sẵn" },
                  UNAVAILABLE: { color: "error", text: "Không có sẵn" },
                  NEED_LIQUID: { color: "warning", text: "Thanh lý" },
                  NO_LONGER_EXIST: { color: "default", text: "Không tồn tại" },
                  READY_TO_STORE: { color: "default", text: "Chuẩn bị vô kho" },
                };

                const config = statusConfig[status] || {
                  color: "default",
                  text: status,
                };

                return <Tag color={config.color}>{config.text}</Tag>;
              },
            },
          ]
        : []),

      ...(stockCheckStatus !== "IN_PROGRESS" && stockCheckStatus !== "COUNTED"
        ? [
            {
              title: "Trạng thái (sau kiểm)",
              dataIndex: "inventoryItemId",
              key: "afterCheckStatus",
              width: "13%",
              align: "center",
              render: (inventoryItemId) => {
                // Tìm trong checkedInventoryItemIds của record gốc
                const checkedItem = rowData.checkedInventoryItemIds?.find(
                  (item) => item.inventoryItemId === inventoryItemId
                );

                let status = "UNAVAILABLE"; // Mặc định là không tìm thấy
                if (checkedItem) {
                  status = checkedItem.status;
                }

                const statusConfig = {
                  AVAILABLE: { color: "success", text: "Có sẵn" },
                  UNAVAILABLE: { color: "error", text: "Không tìm thấy" },
                  NEED_LIQUID: { color: "warning", text: "Thanh lý" },
                  NO_LONGER_EXIST: { color: "default", text: "Không tồn tại" },
                  READY_TO_STORE: { color: "default", text: "Chuẩn bị vô kho" },
                };

                const config = statusConfig[status] || {
                  color: "default",
                  text: status,
                };

                return <Tag color={config.color}>{config.text}</Tag>;
              },
            },
          ]
        : []),

      ...(stockCheckStatus !== "IN_PROGRESS" && stockCheckStatus !== "COUNTED"
        ? [
            {
              title: "Quy cách (sau kiểm)",
              dataIndex: "inventoryItemId",
              key: "afterCheckMeasurement",
              width: "16%",
              align: "center",
              render: (inventoryItemId) => {
                // Tìm trong checkedInventoryItemIds
                const checkedItem = rowData.checkedInventoryItemIds?.find(
                  (item) => item.inventoryItemId === inventoryItemId
                );

                if (checkedItem && checkedItem.measurementValue) {
                  return (
                    <div style={{ textAlign: "center", fontWeight: "600" }}>
                      {checkedItem.measurementValue} {record.measurementUnit}
                    </div>
                  );
                }

                return (
                  <div style={{ textAlign: "center", color: "#999" }}>-</div>
                );
              },
            },
          ]
        : []),
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
            return record.groupIndex % 2 === 0 ? "" : "bg-gray-100";
          }}
        />
      </div>
    );
  };

  const baseColumns = [
    {
      title: "Đã duyệt",
      dataIndex: "isChecked",
      key: "isChecked",
      width: "7%",
      align: "center",
      render: (isChecked) => (
        <div className="flex justify-center approved-checkbox">
          <Checkbox
            checked={isChecked}
            disabled={true}
            style={{
              cursor: "default",
            }}
            className={isChecked ? "text-blue-500" : "text-gray-400"}
          />
          <style>{`
      .approved-checkbox .ant-checkbox-disabled.ant-checkbox-checked .ant-checkbox-inner {
        background-color: #1677ff !important;
        border-color: #1677ff !important;
      }
      .approved-checkbox .ant-checkbox-disabled.ant-checkbox-checked .ant-checkbox-inner::after {
        border-color: #ffffff !important;
      }
      .approved-checkbox .ant-checkbox-disabled .ant-checkbox-inner {
        background-color: #f5f5f5 !important;
        border-color: #d9d9d9 !important;
      }
    `}</style>
        </div>
      ),
    },
    {
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      width: "15%",
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
        // Nếu đang ở state IN_PROGRESS hoặc COUNTED thì hiển thị 0
        let checkedCount = 0;
        if (
          stockCheckStatus !== "IN_PROGRESS" &&
          stockCheckStatus !== "COUNTED"
        ) {
          checkedCount = record.checkedInventoryItemIds
            ? record.checkedInventoryItemIds.length
            : 0;
        }

        const isLacking = checkedCount < record.quantity;
        const isExcess = checkedCount > record.quantity;

        return (
          <div style={{ textAlign: "center" }}>
            <span
              className={
                checkedCount === 0
                  ? "text-gray-600 font-semibold"
                  : isLacking
                  ? "text-red-600 font-semibold"
                  : isExcess
                  ? "text-orange-600 font-semibold"
                  : "text-green-600 font-semibold"
              }
              style={{ fontSize: "18px" }}
            >
              {checkedCount}
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
        // Nếu đang ở state IN_PROGRESS hoặc COUNTED thì hiển thị 0
        let totalCheckedMeasurement = 0;
        if (
          stockCheckStatus !== "IN_PROGRESS" &&
          stockCheckStatus !== "COUNTED"
        ) {
          totalCheckedMeasurement = record.checkedInventoryItemIds
            ? record.checkedInventoryItemIds.reduce(
                (sum, item) => sum + (item.measurementValue || 0),
                0
              )
            : 0;
        }

        const isLacking = totalCheckedMeasurement < record.measurementValue;
        const isExcess = totalCheckedMeasurement > record.measurementValue;

        return (
          <div style={{ textAlign: "center" }}>
            <span
              className={
                totalCheckedMeasurement === 0
                  ? "text-gray-600 font-semibold"
                  : isLacking
                  ? "text-red-600 font-semibold"
                  : isExcess
                  ? "text-orange-600 font-semibold"
                  : "text-green-600 font-semibold"
              }
              style={{ fontSize: "18px" }}
            >
              {totalCheckedMeasurement}
            </span>{" "}
            {record.measurementUnit && (
              <span className="text-gray-500">{record.measurementUnit}</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Trạng thái kiểm kê",
      dataIndex: "status",
      key: "status",
      width: "12%",
      align: "center",
      render: (status, record) => {
        // Nếu đang ở state IN_PROGRESS hoặc COUNTED thì hiển thị "-"
        if (
          stockCheckStatus === "IN_PROGRESS" ||
          stockCheckStatus === "COUNTED"
        ) {
          return "-";
        }

        // So sánh inventoryItemIds với checkedInventoryItemIds
        const totalInventoryItems = record.inventoryItemIds
          ? record.inventoryItemIds.length
          : 0;
        const checkedCount = record.checkedInventoryItemIds
          ? record.checkedInventoryItemIds.length
          : 0;

        let statusConfig;

        if (checkedCount === totalInventoryItems && totalInventoryItems > 0) {
          statusConfig = { color: "success", text: "Trùng khớp" };
        } else if (checkedCount > totalInventoryItems) {
          statusConfig = { color: "error", text: "Thừa" };
        } else if (checkedCount < totalInventoryItems) {
          statusConfig = { color: "error", text: "Thiếu" };
        } else {
          return "-";
        }

        return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
      },
    },
  ];

  // Get columns for WAREHOUSE_MANAGER
  const getWarehouseManagerColumns = () => {
    if (userRole !== AccountRole.WAREHOUSE_MANAGER) return [];

    return [
      {
        title: "Số lượng đã kiểm",
        dataIndex: "actualQuantity",
        key: "wm_actualQuantity",
        width: "37%",
        align: "center",
        render: (text, record) => {
          // WAREHOUSE_MANAGER luôn thấy số thật, không bị ẩn như các role khác
          const checkedCount = record.checkedInventoryItemIds
            ? record.checkedInventoryItemIds.length
            : 0;

          return (
            <div style={{ textAlign: "center" }}>
              <span
                className={"text-black-600 font-semibold"}
                style={{ fontSize: "18px" }}
              >
                {checkedCount}
              </span>{" "}
              {record.unitType && (
                <span className="text-gray-500">{record.unitType}</span>
              )}
            </div>
          );
        },
      },
      {
        title: "Tổng giá trị đã kiểm",
        dataIndex: "actualMeasurementValue",
        key: "wm_actualMeasurementValue",
        width: "37%",
        align: "center",
        render: (text, record) => {
          // WAREHOUSE_MANAGER luôn thấy số thật, không bị ẩn như các role khác
          const totalCheckedMeasurement = record.checkedInventoryItemIds
            ? record.checkedInventoryItemIds.reduce(
                (sum, item) => sum + (item.measurementValue || 0),
                0
              )
            : 0;

          return (
            <div style={{ textAlign: "center" }}>
              <span
                className={"text-black-600 font-semibold"}
                style={{ fontSize: "18px" }}
              >
                {totalCheckedMeasurement}
              </span>{" "}
              {record.measurementUnit && (
                <span className="text-gray-500">{record.measurementUnit}</span>
              )}
            </div>
          );
        },
      },
    ];
  };

  const filteredBaseColumns = baseColumns.filter((column) => {
    // Chỉ hiện cột "Được duyệt" khi status là COMPLETED (áp dụng cho tất cả role)
    if (column.key === "isChecked" && stockCheckStatus !== "COMPLETED") {
      return false;
    }

    if (userRole === AccountRole.WAREHOUSE_MANAGER) {
      // Ẩn các cột: quantity, measurementValue, status cho WAREHOUSE_MANAGER
      if (
        column.key === "quantity" ||
        column.key === "measurementValue" ||
        column.key === "status" ||
        column.key === "actualQuantity" || // Thêm dòng này
        column.key === "actualMeasurementValue" // Thêm dòng này
      ) {
        return false;
      }
    }

    return true;
  });

  const checkboxColumn = {
    title: (
      <Checkbox
        checked={
          // Kiểm tra tất cả items có thể chọn được đã được chọn chưa
          allDetailIds?.every(
            (id) =>
              selectedDetailIds?.includes(id) ||
              stockCheckDetails.find((detail) => detail.id === id)?.status ===
                "MATCH"
          ) && allDetailIds?.length > 0
        }
        onChange={onSelectAllDetails}
      />
    ),
    width: "60px",
    render: (_, record) => (
      <Checkbox
        checked={
          selectedDetailIds?.includes(record.id) || record.status === "MATCH"
        }
        disabled={record.status === "MATCH"}
        onChange={(e) => onSelectDetail(record.id, e.target.checked)}
      />
    ),
  };

  // Combine columns based on role
  const warehouseManagerColumns = getWarehouseManagerColumns();
  const finalColumns =
    userRole === AccountRole.WAREHOUSE_MANAGER
      ? [...filteredBaseColumns, ...warehouseManagerColumns]
      : filteredBaseColumns;

  const columns =
    userRole === AccountRole.MANAGER && stockCheckStatus === "COUNT_CONFIRMED"
      ? [checkboxColumn, ...finalColumns]
      : finalColumns;

  return (
    <Card className="mb-6 mt-4">
      <Table
        columns={columns}
        dataSource={stockCheckDetails}
        rowKey="id"
        loading={stockCheckDetailLoading}
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
        expandable={
          userRole === AccountRole.WAREHOUSE_MANAGER
            ? {
                expandedRowKeys,
                onExpand: handleExpand,
                expandedRowRender: renderWarehouseManagerExpandedRow,
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
              }
            : {
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
              }
        }
      />
    </Card>
  );
};

StockCheckDetailsTable.propTypes = {
  stockCheckDetails: PropTypes.array.isRequired,
  stockCheckDetailLoading: PropTypes.bool.isRequired,
  pagination: PropTypes.object.isRequired,
  onTableChange: PropTypes.func.isRequired,
  getStockCheckDetailByDetailId: PropTypes.func.isRequired,
  userRole: PropTypes.string,
  stockCheckStatus: PropTypes.string,
  selectedDetailIds: PropTypes.array,
  onSelectDetail: PropTypes.func,
  onSelectAllDetails: PropTypes.func,
  allDetailIds: PropTypes.array,
  getInventoryItemsByItemId: PropTypes.func.isRequired,
};

export default StockCheckDetailsTable;
