import React, { useState, useEffect } from "react";
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
  onRemovedItemsNotification,
}) => {
  const [originalData, setOriginalData] = useState([]);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [removedItems, setRemovedItems] = useState([]);
  const [persistentRemovedItems, setPersistentRemovedItems] = useState([]);
  const [showRemovedItemsWarning, setShowRemovedItemsWarning] = useState(true);

  // Reset states when data changes completely
  useEffect(() => {
    setHasProcessed(false);
    setOriginalData([]);
    setPersistentRemovedItems([]);
    if (onTableErrorChange) {
      onTableErrorChange(false);
    }
  }, [onTableErrorChange]);

  // Process data to remove items with zero stock
  useEffect(() => {
    if (!items || items.length === 0 || !data || data.length === 0) return;

    // Reset when data changes completely
    if (JSON.stringify(data) !== JSON.stringify(originalData)) {
      setOriginalData(data);
      setHasProcessed(false);
    }

    if (!hasProcessed) {
      const timeoutId = setTimeout(() => {
        const itemsToRemove = [];
        const itemsToKeep = [];

        data.forEach((item) => {
          const itemMeta = items.find(
            (i) => String(i.id) === String(item.itemId)
          );
          const stockQuantity = itemMeta?.quantity ?? 0;

          // Remove items with zero stock quantity
          if (stockQuantity === 0) {
            itemsToRemove.push({
              itemId: item.itemId,
              itemName:
                item.itemName || itemMeta?.name || `Item ${item.itemId}`,
              unitType: item.unitType || itemMeta?.unitType || "",
              measurementUnit:
                item.measurementUnit || itemMeta?.measurementUnit || "",
            });
          } else {
            itemsToKeep.push(item);
          }
        });

        setRemovedItems(itemsToRemove);
        if (itemsToRemove.length > 0) {
          setPersistentRemovedItems(itemsToRemove);
        }

        if (itemsToRemove.length > 0) {
          onDataChange(itemsToKeep);
          if (onRemovedItemsNotification) {
            onRemovedItemsNotification(itemsToRemove);
          }
        }

        setHasProcessed(true);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    data,
    items,
    hasProcessed,
    originalData,
    onDataChange,
    onRemovedItemsNotification,
  ]);

  // Reset removed items when no data
  useEffect(() => {
    if (!data || data.length === 0) {
      setRemovedItems([]);
      setPersistentRemovedItems([]);
    }
  }, [data?.length]);

  // Reset warning visibility when new persistent removed items
  useEffect(() => {
    if (persistentRemovedItems.length > 0) {
      setShowRemovedItemsWarning(true);
    }
  }, [persistentRemovedItems.length]);

  const columns = [
    {
      width: "15%",
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      render: (text) => <div>{text}</div>,
    },
    {
      width: "25%",
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      width: "15%",
      title: <span className="font-semibold">Đơn vị tính</span>,
      dataIndex: "unitType",
      key: "unitType",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (text) => (
        <span style={{ display: "block", textAlign: "center" }}>{text}</span>
      ),
    },
    {
      width: "45%",
      title: <span className="font-semibold">Quy cách</span>,
      dataIndex: "totalMeasurementValue",
      key: "totalMeasurementValue",
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
            {measurementValueFromDB} {record.measurementUnit} /{" "}
            {record.unitType}
          </span>
        );
      },
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
          Tổng số mặt hàng cần kiểm kho: {data.length}
        </div>

        {/* Thông báo sản phẩm bị loại bỏ */}
        {persistentRemovedItems.length > 0 && showRemovedItemsWarning && (
          <div
            style={{
              marginTop: 12,
              padding: 16,
              backgroundColor: "#fef3cd",
              border: "1px solid #faad14",
              borderRadius: 8,
              borderLeft: "4px solid #faad14",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowRemovedItemsWarning(false)}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "none",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                color: "#ad6800",
                padding: "4px",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f0f0f0";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
              }}
              title="Đóng thông báo"
            >
              ×
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 5,
                paddingRight: 30,
              }}
            >
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#ad6800",
                }}
              >
                Sản phẩm bị loại bỏ khỏi danh sách cần kiểm kho
              </div>
              <div
                style={{
                  marginLeft: 8,
                  backgroundColor: "#faad14",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {persistentRemovedItems.length}
              </div>
            </div>

            <div
              style={{
                color: "#ad6800",
                fontSize: "13px",
                lineHeight: "1.5",
                marginBottom: 8,
              }}
            >
              Các sản phẩm sau không có hàng tồn kho để kiểm kê:
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                border: "1px solid #faad14",
                borderRadius: 6,
                padding: 12,
                maxHeight: "8rem",
                overflowY: "auto",
              }}
            >
              {persistentRemovedItems.map((item, index) => (
                <div
                  key={`${item.itemId}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom:
                      index < persistentRemovedItems.length - 1
                        ? "1px solid #f0f0f0"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor: "#faad14",
                      borderRadius: "50%",
                      marginRight: 10,
                    }}
                  ></div>
                  <div
                    style={{
                      fontWeight: "500",
                      color: "#262626",
                      marginRight: 8,
                      fontSize: "13px",
                    }}
                  >
                    {item.itemId}
                  </div>
                  <div
                    style={{
                      color: "#595959",
                      fontSize: "13px",
                    }}
                  >
                    {item.itemName}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              * Các sản phẩm này đã được tự động loại bỏ khỏi danh sách kiểm kho
            </div>
          </div>
        )}
      </div>

      {/* Bảng dữ liệu */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record) => String(record?.itemId)}
        pagination={pagination.total > pagination.pageSize ? pagination : false}
        onChange={onPaginationChange}
        rowClassName={(_, index) => (index % 2 === 0 ? "bg-gray-100" : "")}
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
  onRemovedItemsNotification: PropTypes.func,
};

export default ExcelDataTable;
