import React, { useState, useEffect, useRef } from "react";
import { Table, Input } from "antd";
import PropTypes from "prop-types";
import { InfoCircleFilled } from "@ant-design/icons";
// Thêm vào đầu file

const ExcelDataTable = ({
  data,
  onDataChange,
  items,
  onTableErrorChange,
  pagination,
  onPaginationChange,
  setPagination, // <--- thêm prop này
  exportType, // nhận vào ở đây cho exportType!
}) => {
  const [fieldErrors, setFieldErrors] = useState({});
  const pendingScrollItemId = useRef(null);

  // Validate số lượng
  const validateQuantity = (value, itemId) => {
    if (value === "" || value === undefined || value === null)
      return "Vui lòng nhập số!";
    if (!/^\d+$/.test(value)) return "Không nhập chữ!";
    const num = Number(value);
    if (isNaN(num) || num <= 0) return "Phải lớn hơn 0!";
    const itemMeta = items?.find((item) => String(item.id) === String(itemId));
    const maxValue = itemMeta?.totalMeasurementValue ?? Infinity;
    if (num > maxValue) return `Tối đa còn ${maxValue}!`;
    return "";
  };

  useEffect(() => {
    const newErrors = {};
    data.forEach((item) => {
      const error = validateQuantity(item?.quantity?.toString(), item.itemId);
      if (error) newErrors[item.itemId] = error;
    });
    setFieldErrors(newErrors);
    if (onTableErrorChange)
      onTableErrorChange(Object.keys(newErrors).length > 0);
  }, [data, items]);

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
          style={{ textAlign: "right", width: 75 }}
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
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      render: (text) => <div>#{text}</div>,
    },
    { title: "Tên hàng", dataIndex: "itemName", key: "itemName" },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 140,
      render: (text, record) => <QuantityInput record={record} />,
    },
    {
      title: "Giá trị đo lường",
      dataIndex: "totalMeasurementValue",
      key: "totalMeasurementValue",
      width: 140,
      render: (text) => (
        <div style={{ paddingLeft: 12, textAlign: "right" }}>{text}</div>
      ),
    },
    {
      title: "Đơn vị tính",
      dataIndex: "measurementUnit",
      key: "measurementUnit",
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
          title: "Nhà cung cấp",
          dataIndex: "providerId",
          key: "providerId",
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
        {Object.keys(fieldErrors).length > 0 && (
          <>
            <div style={{ marginTop: 4, color: "red" }}>
              Tổng số mặt hàng vượt số lượng được xuất:{" "}
              {Object.keys(fieldErrors).length}
            </div>
            <div style={{ marginTop: 4, color: "red" }}>
              Các mặt hàng lỗi:{" "}
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
          </>
        )}
      </div>

      {/* Bảng dữ liệu */}
      <Table
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
  setPagination: PropTypes.func, // <--- thêm cái này
  exportType: PropTypes.string.isRequired, // nhận vào ở đây cho exportType!
};

export default ExcelDataTable;
