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
  onRemovedItemsReset, // Thêm prop để reset từ parent
}) => {
  const [originalData, setOriginalData] = useState([]);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [removedItems, setRemovedItems] = useState([]); // Lưu danh sách item bị xóa
  const pendingScrollItemId = useRef(null);

  // Thêm function để reset removedItems từ bên ngoài
  const resetRemovedItems = () => {
    setRemovedItems([]);
  };

  // Validate số lượng
  const validateQuantity = (value, itemId) => {
    if (value === "" || value === undefined || value === null)
      return "Vui lòng nhập số!";
    if (!/^\d+$/.test(value)) return "Không nhập chữ!";
    const num = Number(value);
    if (isNaN(num) || num <= 0) return "Phải lớn hơn 0!";
    const itemMeta = items?.find((item) => String(item.id) === String(itemId));
    const maxValue = itemMeta?.quantity ?? Infinity;
    if (num > maxValue) return `Tối đa còn ${maxValue}!`;
    return "";
  };

  // Expose reset function ra ngoài qua ref hoặc callback
  useEffect(() => {
    if (onRemovedItemsReset) {
      onRemovedItemsReset(resetRemovedItems);
    }
  }, [onRemovedItemsReset]);

  useEffect(() => {
    if (!items || items.length === 0 || !data || data.length === 0) return;

    // Chỉ xử lý nếu data khác với originalData (data mới từ file)
    if (JSON.stringify(data) !== JSON.stringify(originalData)) {
      setOriginalData(data); // Lưu data gốc
      setHasProcessed(false); // Reset flag
    }

    // Chỉ xử lý filter một lần cho mỗi data set mới
    if (!hasProcessed) {
      const itemsToRemove = [];
      const itemsToKeep = [];

      data.forEach((item) => {
        const itemMeta = items.find(
          (i) => String(i.id) === String(item.itemId)
        );
        const stockQuantity = itemMeta?.quantity ?? 0;

        if (stockQuantity === 0) {
          itemsToRemove.push({
            itemId: item.itemId,
            itemName: item.itemName || itemMeta?.name || `Item ${item.itemId}`,
            requestedQuantity: item.quantity,
            unitType: item.unitType || itemMeta?.unitType || "",
          });
        } else {
          itemsToKeep.push(item);
        }
      });

      // Cập nhật removedItems
      setRemovedItems(itemsToRemove);

      // Chỉ update data nếu có items bị remove
      if (itemsToRemove.length > 0) {
        onDataChange(itemsToKeep);
      }

      setHasProcessed(true); // Đánh dấu đã xử lý
    }
  }, [data, items]); // Bỏ onDataChange khỏi dependencies

  // Validate errors cho các item còn lại
  useEffect(() => {
    const newErrors = {};
    data.forEach((item) => {
      const error = validateQuantity(item?.quantity?.toString(), item.itemId);
      if (error) newErrors[item.itemId] = error;
    });
    setFieldErrors(newErrors);
    if (onTableErrorChange) {
      onTableErrorChange(Object.keys(newErrors).length > 0);
    }
  }, [data, items, onTableErrorChange]);

  useEffect(() => {
    // Reset removed items khi không còn data
    if (!data || data.length === 0) {
      setRemovedItems([]);
    }
  }, [data?.length]);

  // Trong ExcelDataTable
  useEffect(() => {
    console.log("Debug - data:", data);
    console.log("Debug - items:", items);

    data.forEach((item) => {
      const itemMeta = items.find((i) => String(i.id) === String(item.itemId));
      console.log(`Item ${item.itemId}:`, {
        stockQuantity: itemMeta?.quantity,
        hasStock: (itemMeta?.quantity ?? 0) > 0,
      });
    });
  }, [data, items]);

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

  // Đây là cách tốt nhất: chuyển trang và sau đó scroll đúng dòng
  const handleScrollToRow = (itemId) => {
    const index = data.findIndex(
      (item) => String(item.itemId) === String(itemId)
    );
    if (index === -1) return;
    const page = Math.floor(index / pagination.pageSize) + 1;
    if (pagination.current !== page) {
      pendingScrollItemId.current = itemId;
      // Gọi setPagination để chuyển trang
      if (setPagination) setPagination((prev) => ({ ...prev, current: page }));
      if (onPaginationChange)
        onPaginationChange({ ...pagination, current: page });
    } else {
      doScroll(itemId);
    }
  };

  // Sau khi Table render lại (pagination.current thay đổi), scroll nếu cần
  useEffect(() => {
    if (pendingScrollItemId.current) {
      setTimeout(() => {
        doScroll(pendingScrollItemId.current);
        pendingScrollItemId.current = null;
      }, 100); // Table Antd cần thời gian để render xong
    }
  }, [pagination.current]);

  // Hàm scroll và highlight
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

  const columns = [
    {
      width: "10%",
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      render: (text) => <div>{text}</div>,
    },
    { width: "12%", title: "Tên hàng", dataIndex: "itemName", key: "itemName" },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      width: "9%",
      render: (text, record) => <QuantityInput record={record} />,
    },
    {
      width: "12%",
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
      width: "18%",
      title: <span className="font-semibold">Quy cách</span>,
      dataIndex: "unitType",
      key: "unitType",
      align: "center",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (_, record) => {
        return (
          <span>
            {record.measurementValue} {record.measurementUnit} /{" "}
            {record.unitType}
          </span>
        );
      },
    },
    // Điều kiện column Quy cách
    ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(exportType)
      ? {
          title: "Quy cách",
          dataIndex: "measurementValue",
          key: "measurementValue",
        }
      : null,
    // Điều kiện column Nhà cung cấp
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
        {/* // Và trong phần render, sửa lại hiển thị: */}
        {removedItems.length > 0 && (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              backgroundColor: "#ffffe0",
              border: "1px solid #ffccc7",
              borderRadius: 4,
            }}
          >
            <div
              style={{ color: "black", fontWeight: "bold", marginBottom: 4 }}
            >
              Tổng cộng có{" "}
              <span style={{ color: "red" }}>{removedItems.length}</span> sản
              phẩm không xuất được (tồn kho bằng 0):
            </div>
            <div style={{ color: "#d32029", fontSize: "14px" }}>
              {removedItems.map((item, index) => (
                <div key={`${item.itemId}-${index}`}>
                  • {item.itemId} - Đã yêu cầu: {item.requestedQuantity}{" "}
                  {item.unitType}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: "12px",
                color: "#8c8c8c",
                fontStyle: "italic",
              }}
            >
              * Các sản phẩm này đã được tự động loại bỏ khỏi danh sách xuất kho
            </div>
          </div>
        )}

        {Object.keys(fieldErrors).length > 0 && (
          <>
            <div
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: "#fff1f0",
                border: "1px solid #ffccc7",
                borderRadius: 4,
              }}
            >
              <div style={{ marginTop: 4, color: "red", fontWeight: "bold" }}>
                Tổng số mặt hàng vượt số lượng được xuất:{" "}
                {Object.keys(fieldErrors).length}
              </div>
              <div style={{ marginTop: 4, color: "red" }}>
                • Các mặt hàng lỗi:{" "}
                {Object.keys(fieldErrors).map((id, idx) => (
                  <span
                    key={id}
                    onClick={() => handleScrollToRow(id)}
                    style={{
                      cursor: "pointer",
                      color: "#1890ff",
                      textDecoration: "underline",
                      marginRight: 4,
                    }}
                  >
                    #{id}
                    {idx < Object.keys(fieldErrors).length - 1 ? "," : ""}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bảng dữ liệu */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record) => String(record?.itemId)}
        pagination={pagination.total > pagination.pageSize ? pagination : false}
        onChange={onPaginationChange}
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
      {/* <Table
        columns={columns}
        dataSource={data}
        rowKey={(record) => String(record?.itemId)}
        pagination={pagination}
        onChange={onPaginationChange}
        components={{
          body: {
            row: ({ children, ...restProps }) => (
              <tr {...restProps} id={`row-${restProps["data-row-key"]}`}>
                {children}
              </tr>
            ),
          },
        }}
      /> */}
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
};

export default ExcelDataTable;
