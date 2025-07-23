import React, { useState, useEffect, useRef } from "react";
import { Table, Input, Select } from "antd";
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
  exportType,
  providers,
  onRemovedItemsReset,
  onRemovedItemsNotification,
}) => {
  const [originalData, setOriginalData] = useState([]);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [removedItems, setRemovedItems] = useState([]);
  const [persistentRemovedItems, setPersistentRemovedItems] = useState([]); // ✅ THÊM state này để lưu permanent
  const pendingScrollItemId = useRef(null);
  const [showRemovedItemsWarning, setShowRemovedItemsWarning] = useState(true);

  // Thêm function để reset removedItems từ bên ngoài
  const resetRemovedItems = () => {
    setRemovedItems([]);
    setPersistentRemovedItems([]); // ✅ RESET cả persistent
  };

  // Validate số lượng
  const validateQuantity = (value, itemId) => {
    if (value === "" || value === undefined || value === null)
      return "Vui lòng nhập số!";
    if (!/^\d+$/.test(value)) return "Không nhập chữ!";
    const num = Number(value);
    if (isNaN(num) || num <= 0) return "Phải lớn hơn 0!";

    const itemMeta = items?.find((item) => String(item.id) === String(itemId));

    // Tính maxValue = numberOfAvailableItems - minimumStockQuantity
    const availableItems = itemMeta?.numberOfAvailableItems ?? 0;
    const minimumStock = itemMeta?.minimumStockQuantity ?? 0;
    const maxValue = availableItems - minimumStock;

    // Nếu maxValue <= 0 thì không đủ tồn kho để xuất
    if (maxValue <= 0) {
      return "Không đủ tồn kho khả dụng để xuất!";
    }

    if (num > maxValue) {
      return `Tối đa có thể xuất ${maxValue} ${itemMeta?.unitType || ""}!`;
    }

    return "";
  };

  // Validate giá trị đo lường
  const validateMeasurementValue = (value, itemId) => {
    if (value === "" || value === undefined || value === null)
      return "Vui lòng nhập giá trị!";
    if (!/^\d*\.?\d+$/.test(value)) return "Không nhập chữ!";
    const num = Number(value);
    if (isNaN(num) || num <= 0) return "Phải lớn hơn 0!";

    const itemMeta = items?.find((item) => String(item.id) === String(itemId));

    // ✅ SỬA: Sử dụng công thức mới
    const numberOfAvailableMeasurementValues =
      itemMeta?.numberOfAvailableMeasurementValues ?? 0;
    const minimumStockQuantity = itemMeta?.minimumStockQuantity ?? 0;
    const measurementValue = itemMeta?.measurementValue ?? 0;

    const maxValue =
      numberOfAvailableMeasurementValues -
      minimumStockQuantity * measurementValue;

    // Nếu maxValue <= 0 thì không đủ tồn kho để xuất
    if (maxValue <= 0) {
      return "Không đủ tồn kho khả dụng để xuất!";
    }

    if (num > maxValue) {
      return `Tối đa có thể xuất ${maxValue} ${
        itemMeta?.measurementUnit || ""
      }!`;
    }

    return "";
  };

  // Expose reset function ra ngoài qua ref hoặc callback
  useEffect(() => {
    if (onRemovedItemsReset) {
      onRemovedItemsReset(resetRemovedItems);
    }
  }, [onRemovedItemsReset]);

  useEffect(() => {
    // Reset tất cả states khi exportType thay đổi
    setFieldErrors({});
    setHasProcessed(false);
    setOriginalData([]);
    setPersistentRemovedItems([]); // ✅ RESET persistent khi đổi export type
    if (onTableErrorChange) {
      onTableErrorChange(false);
    }
  }, [exportType, onTableErrorChange]);

  // ✅ EFFECT RIÊNG để xử lý việc tìm và lưu persistentRemovedItems CHỈ MỘT LẦN
  useEffect(() => {
    if (!items || items.length === 0 || !data || data.length === 0) return;

    // Reset khi exportType thay đổi hoặc data thay đổi hoàn toàn
    if (JSON.stringify(data) !== JSON.stringify(originalData)) {
      setOriginalData(data);
      setHasProcessed(false);
    }

    if (!hasProcessed) {
      // Đợi một chút để đảm bảo component đã render hoàn toàn
      const timeoutId = setTimeout(() => {
        const itemsToRemove = [];
        const itemsToKeep = [];

        data.forEach((item) => {
          const itemMeta = items.find(
            (i) => String(i.id) === String(item.itemId)
          );
          const stockQuantity = itemMeta?.quantity ?? 0;

          // Tính maxValue để kiểm tra có đủ tồn kho khả dụng không
          let shouldRemoveItem = false;

          if (exportType === "SELLING") {
            const availableItems = itemMeta?.numberOfAvailableItems ?? 0;
            const minimumStock = itemMeta?.minimumStockQuantity ?? 0;
            const maxValue = availableItems - minimumStock;

            // Loại bỏ nếu hết tồn kho HOẶC không đủ tồn kho khả dụng
            shouldRemoveItem = stockQuantity === 0 || maxValue <= 0;
          } else if (
            ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(exportType)
          ) {
            // ✅ SỬA: Thêm logic kiểm tra cho measurement value types
            const numberOfAvailableMeasurementValues =
              itemMeta?.numberOfAvailableMeasurementValues ?? 0;
            const minimumStockQuantity = itemMeta?.minimumStockQuantity ?? 0;
            const measurementValue = itemMeta?.measurementValue ?? 0;

            const maxValue =
              numberOfAvailableMeasurementValues -
              minimumStockQuantity * measurementValue;

            // Loại bỏ nếu hết tồn kho HOẶC không đủ measurement value khả dụng
            shouldRemoveItem = stockQuantity === 0 || maxValue <= 0;
          } else {
            // Các export type khác chỉ loại bỏ khi hết tồn kho
            shouldRemoveItem = stockQuantity === 0;
          }

          if (shouldRemoveItem) {
            // Lấy requested amount dựa trên export type
            let requestedAmount;
            if (
              exportType === "PRODUCTION" ||
              exportType === "BORROWING" ||
              exportType === "LIQUIDATION"
            ) {
              requestedAmount = item.measurementValue || 0;
            } else {
              requestedAmount = item.quantity || 0;
            }

            itemsToRemove.push({
              itemId: item.itemId,
              itemName:
                item.itemName || itemMeta?.name || `Item ${item.itemId}`,
              requestedQuantity: requestedAmount,
              unitType: item.unitType || itemMeta?.unitType || "",
              measurementUnit:
                item.measurementUnit || itemMeta?.measurementUnit || "",
            });
          } else {
            itemsToKeep.push(item);
          }
        });

        setRemovedItems(itemsToRemove);
        // ✅ CHỈ SET persistent khi lần đầu xử lý, không bị ghi đè bởi data changes
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
    exportType,
    hasProcessed,
    originalData,
    onDataChange,
    onRemovedItemsNotification,
  ]);

  useEffect(() => {
    const newErrors = {};

    data.forEach((item) => {
      let error = "";

      // SELLING chỉ validate quantity
      if (exportType === "SELLING") {
        if (item.quantity !== undefined) {
          error = validateQuantity(item?.quantity?.toString(), item.itemId);
        }
      }
      // PRODUCTION, BORROWING, LIQUIDATION chỉ validate measurementValue
      else if (
        ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(exportType)
      ) {
        if (item.measurementValue !== undefined) {
          error = validateMeasurementValue(
            item?.measurementValue?.toString(),
            item.itemId
          );
        }
      }

      if (error) newErrors[item.itemId] = error;
    });

    setFieldErrors(newErrors);
    if (onTableErrorChange) {
      onTableErrorChange(Object.keys(newErrors).length > 0);
    }
  }, [data, items, onTableErrorChange, exportType]);

  useEffect(() => {
    // Reset removed items khi không còn data
    if (!data || data.length === 0) {
      setRemovedItems([]);
      setPersistentRemovedItems([]); // ✅ RESET cả persistent
    }
  }, [data?.length]);

  // ✅ EFFECT để reset showRemovedItemsWarning khi có persistentRemovedItems mới
  useEffect(() => {
    if (persistentRemovedItems.length > 0) {
      setShowRemovedItemsWarning(true);
    }
  }, [persistentRemovedItems.length]);

  // Hàm này chỉ xử lý provider
  const handleCellChange = (value, record, field) => {
    const updatedData = data.map((row) => {
      if (row === record && field === "providerId") {
        const newProvider = providers.find((p) => p.id === value);
        return {
          ...row,
          providerId: value,
          providerName: newProvider ? newProvider.name : "",
        };
      }
      return row;
    });
    onDataChange(updatedData);
  };

  const handleQuantityChange = (itemId, value) => {
    const updatedData = data.map((item) =>
      String(item.itemId) === String(itemId)
        ? { ...item, quantity: value }
        : item
    );
    onDataChange(updatedData);
  };

  const handleMeasurementValueChange = (itemId, value) => {
    const updatedData = data.map((item) =>
      String(item.itemId) === String(itemId)
        ? { ...item, measurementValue: value }
        : item
    );
    onDataChange(updatedData);
  };

  const handleScrollToRow = (itemId) => {
    const index = data.findIndex(
      (item) => String(item.itemId) === String(itemId)
    );
    if (index === -1) return;
    const page = Math.floor(index / pagination.pageSize) + 1;
    if (pagination.current !== page) {
      pendingScrollItemId.current = itemId;
      if (setPagination) setPagination((prev) => ({ ...prev, current: page }));
      if (onPaginationChange)
        onPaginationChange({ ...pagination, current: page });
    } else {
      doScroll(itemId);
    }
  };

  useEffect(() => {
    if (pendingScrollItemId.current) {
      setTimeout(() => {
        doScroll(pendingScrollItemId.current);
        pendingScrollItemId.current = null;
      }, 100);
    }
  }, [pagination.current]);

  const doScroll = (itemId) => {
    const el = document.getElementById(`row-${itemId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background-color 0.3s";
      el.style.backgroundColor = "#fff1f0";
      setTimeout(() => {
        el.style.backgroundColor = "";
      }, 1500);
    }
  };

  const QuantityInput = ({ record }) => {
    const [localValue, setLocalValue] = useState(record.quantity);

    useEffect(() => {
      setLocalValue(record.quantity);
    }, [record.quantity]);

    const handleBlur = () => {
      handleQuantityChange(record.itemId, localValue);
    };

    return (
      <div>
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          min={1}
          value={localValue}
          style={{ textAlign: "right", width: 80 }}
          onWheel={(e) => e.currentTarget.blur()}
          onKeyDown={(e) => {
            if (["e", "E", "+", "-", "."].includes(e.key)) {
              e.preventDefault();
            }
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          status={fieldErrors[record.itemId] ? "error" : undefined}
        />
        {fieldErrors[record.itemId] && (
          <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
            {fieldErrors[record.itemId]}
          </div>
        )}
      </div>
    );
  };

  QuantityInput.propTypes = {
    record: PropTypes.shape({
      quantity: PropTypes.number.isRequired,
      itemId: PropTypes.string.isRequired,
    }).isRequired,
  };

  const MeasurementValueInput = ({ record }) => {
    const [localValue, setLocalValue] = useState(record.measurementValue);

    useEffect(() => {
      setLocalValue(record.measurementValue);
    }, [record.measurementValue]);

    const handleBlur = () => {
      handleMeasurementValueChange(record.itemId, localValue);
    };

    return (
      <div>
        <Input
          inputMode="decimal"
          value={localValue}
          style={{ textAlign: "right", width: 100 }}
          onWheel={(e) => e.currentTarget.blur()}
          onKeyDown={(e) => {
            if (["e", "E", "+", "-"].includes(e.key)) {
              e.preventDefault();
            }
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          status={fieldErrors[record.itemId] ? "error" : undefined}
        />
        {fieldErrors[record.itemId] && (
          <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
            {fieldErrors[record.itemId]}
          </div>
        )}
      </div>
    );
  };

  MeasurementValueInput.propTypes = {
    record: PropTypes.shape({
      measurementValue: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
      ]).isRequired,
      itemId: PropTypes.string.isRequired,
    }).isRequired,
  };

  const columns = [
    {
      width: "10%",
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      render: (text) => <div>{text}</div>,
    },
    { width: "12%", title: "Tên hàng", dataIndex: "itemName", key: "itemName" },
    ["SELLING"].includes(exportType)
      ? {
          title: "Số lượng",
          dataIndex: "quantity",
          key: "quantity",
          align: "center",
          width: "9%",
          render: (text, record) => <QuantityInput record={record} />,
        }
      : null,
    ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(exportType)
      ? {
          title: "Giá trị cần xuất",
          dataIndex: "measurement",
          key: "measurement",
          align: "center",
          width: "9%",
          render: (text, record) => <MeasurementValueInput record={record} />,
        }
      : null,
    ["SELLING"].includes(exportType)
      ? {
          width: "12%",
          title: <span className="font-semibold">Đơn vị tính</span>,
          dataIndex: "unitType",
          key: "unitType",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (text) => (
            <span style={{ display: "block", textAlign: "center" }}>
              {text}
            </span>
          ),
        }
      : null,
    ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(exportType)
      ? {
          width: "12%",
          title: <span className="font-semibold">Đơn vị tính</span>,
          dataIndex: "measurementUnit",
          key: "measurementUnit",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (_, record) => {
            return (
              <span style={{ display: "block", textAlign: "center" }}>
                {record.measurementUnit}
              </span>
            );
          },
        }
      : null,
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
    exportType === "RETURN"
      ? {
          width: "35%",
          title: "Nhà cung cấp",
          dataIndex: "providerName",
          key: "providerName",
          render: (_, record) => {
            const selectedItem = items.find(
              (i) => String(i.id) === String(record.itemId)
            );
            const validProviderIds = selectedItem
              ? selectedItem.providerIds
              : [];
            const selectableProviders = providers.filter((p) =>
              validProviderIds.includes(p.id)
            );
            return (
              <Select
                value={record.providerId}
                onChange={(val) => handleCellChange(val, record, "providerId")}
                style={{ width: "100%" }}
                showSearch
                optionFilterProp="children"
                placeholder="Tìm theo nhà cung cấp..."
              >
                {selectableProviders.map((provider) => (
                  <Select.Option key={provider.id} value={provider.id}>
                    {provider.name}
                  </Select.Option>
                ))}
              </Select>
            );
          },
        }
      : null,
  ].filter(Boolean);

  return (
    <>
      {/* Khối thông tin xuất kho */}
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
        <div style={{ marginTop: 4 }}>Tổng số mặt hàng xuất: {data.length}</div>
        {/* ✅ SỬA: Dùng persistentRemovedItems thay vì removedItems */}
        {(persistentRemovedItems.length > 0 ||
          Object.keys(fieldErrors).length > 0) && (
          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 12,
              maxHeight: "15rem",
              alignItems: "stretch",
            }}
          >
            {/* ✅ SỬA: Dùng persistentRemovedItems */}
            {persistentRemovedItems.length > 0 && showRemovedItemsWarning && (
              <div
                style={{
                  padding: 16,
                  backgroundColor: "#fef3cd",
                  border: "1px solid #faad14",
                  borderRadius: 8,
                  borderLeft: "4px solid #faad14",
                  width:
                    Object.keys(fieldErrors).length > 0
                      ? "calc(50% - 6px)"
                      : "100%",
                  display: "flex",
                  flexDirection: "column",
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
                    Sản phẩm không xuất được
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
                  Các sản phẩm sau không có tồn kho khả dụng:
                </div>

                <div
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #faad14",
                    borderRadius: 6,
                    padding: 12,
                    flex: 1,
                    overflowY: "auto",
                    maxHeight: "8rem",
                  }}
                >
                  {/* ✅ SỬA: Dùng persistentRemovedItems */}
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
                        Yêu cầu: {item.requestedQuantity}{" "}
                        {exportType === "SELLING"
                          ? item.unitType
                          : item.measurementUnit}
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
                  * Các sản phẩm này đã được tự động loại bỏ khỏi danh sách xuất
                  kho
                </div>
              </div>
            )}

            {Object.keys(fieldErrors).length > 0 && (
              <div
                style={{
                  padding: 16,
                  backgroundColor: "#fff1f0",
                  border: "1px solid #ff7875",
                  borderRadius: 8,
                  borderLeft: "4px solid #ff4d4f",
                  width:
                    persistentRemovedItems.length > 0
                      ? "calc(50% - 6px)"
                      : "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 5,
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#cf1322",
                    }}
                  >
                    Mặt hàng vượt số lượng / Sai định dạng
                  </div>
                  <div
                    style={{
                      marginLeft: 8,
                      backgroundColor: "#ff4d4f",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {Object.keys(fieldErrors).length}
                  </div>
                </div>

                <div
                  style={{
                    color: "#cf1322",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    marginBottom: 8,
                  }}
                >
                  Các mặt hàng sau đã vượt quá số lượng cho phép / Nhập sai định
                  dạng:
                </div>

                <div
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #ff7875",
                    borderRadius: 6,
                    padding: 12,
                    flex: 1,
                    overflowY: "auto",
                    maxHeight: "8rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {Object.keys(fieldErrors).map((id, idx) => (
                      <span
                        key={id}
                        onClick={() => handleScrollToRow(id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 8px",
                          backgroundColor: "#e6f7ff",
                          border: "1px solid #91d5ff",
                          borderRadius: "4px",
                          cursor: "pointer",
                          color: "#1890ff",
                          fontSize: "12px",
                          fontWeight: "500",
                          transition: "all 0.2s",
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#bae7ff";
                          e.target.style.borderColor = "#69c0ff";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#e6f7ff";
                          e.target.style.borderColor = "#91d5ff";
                        }}
                      >
                        #{id}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  * Nhấp vào mã sản phẩm để di chuyển đến dòng tương ứng
                </div>
              </div>
            )}
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
      quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      measurementValue: PropTypes.string,
    })
  ).isRequired,
  onDataChange: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
  onTableErrorChange: PropTypes.func,
  pagination: PropTypes.object,
  onPaginationChange: PropTypes.func,
  setPagination: PropTypes.func,
  exportType: PropTypes.string.isRequired,
  providers: PropTypes.array.isRequired,
  onRemovedItemsReset: PropTypes.func, // Thêm prop type
  record: PropTypes.shape({
    measurementValue: PropTypes.string,
    measurementUnit: PropTypes.string,
    unitType: PropTypes.string,
    itemId: PropTypes.string.isRequired,
    providerId: PropTypes.string,
  }).isRequired,
  onRemovedItemsNotification: PropTypes.func,
};

export default ExcelDataTable;
