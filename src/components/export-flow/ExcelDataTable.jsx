import React, { useState, useEffect } from "react";
import { Table, Input } from "antd";
import PropTypes from "prop-types";

const ExcelDataTable = ({
  data,
  onDataChange,
  items,
  onTableErrorChange,
  pagination,
  onPaginationChange,
}) => {
  const [fieldErrors, setFieldErrors] = useState({});

  // Hàm validate đúng từng dòng theo itemId của dòng đó
  const validateQuantity = (value, itemId) => {
    if (value === "" || value === undefined || value === null) {
      return "Vui lòng nhập số!";
    }
    if (!/^\d+$/.test(value)) {
      return "Không nhập chữ!";
    }
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return "Phải lớn hơn 0!";
    }
    // Lấy maxValue đúng theo itemId
    const itemMeta = items.find((item) => item.id === itemId);
    const maxValue = itemMeta?.totalMeasurementValue ?? Infinity;
    if (num > maxValue) {
      return `Tối đa còn ${maxValue}!`;
    }
    return "";
  };

  // Kiểm tra lỗi cho từng dòng khi load data/items
  useEffect(() => {
    const newErrors = {};
    data.forEach((item, idx) => {
      const error = validateQuantity(item.quantity?.toString(), item.itemId);
      if (error) newErrors[idx] = error;
    });
    setFieldErrors(newErrors);
    // Báo cho cha biết có lỗi không
    if (typeof onTableErrorChange === "function") {
      onTableErrorChange(Object.keys(newErrors).length > 0);
    }
  }, [data, items]); // luôn chạy khi data hoặc items đổi

  // Khi nhập thì validate theo từng itemId
  const handleQuantityChange = (index, value) => {
    const itemId = data[index].itemId;
    const error = validateQuantity(value, itemId);

    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[index] = error;
      } else {
        delete newErrors[index]; // xoá lỗi khi hợp lệ
      }
      // Báo cho cha biết có lỗi không (realtime mỗi lần nhập)
      if (typeof onTableErrorChange === "function") {
        onTableErrorChange(Object.keys(newErrors).length > 0);
      }
      return newErrors;
    });

    // Nếu hợp lệ thì cập nhật data
    if (!error) {
      const newData = data.map((item, idx) =>
        idx === index ? { ...item, quantity: Number(value) } : item
      );
      onDataChange(newData);
    }
  };

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
      width: 140,
      key: "quantity",
      render: (text, record, index) => (
        <div>
          <Input
            value={record.quantity}
            onChange={(e) => handleQuantityChange(index, e.target.value)}
            style={{ width: 75, textAlign: "right" }}
            status={fieldErrors[index] ? "error" : undefined}
            min={1}
          />
          {fieldErrors[index] && (
            <div className="text-red-500 text-xs mt-1">
              {fieldErrors[index]}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Giá trị đo lường",
      dataIndex: "totalMeasurementValue",
      key: "totalMeasurementValue",
      width: 140,
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
      rowKey={(_, index) => index}
      pagination={pagination} // nhận từ props
      onChange={(paginationObj) => {
        if (onPaginationChange) onPaginationChange(paginationObj);
      }}
    />
  );
};

ExcelDataTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.number,
      itemName: PropTypes.string,
      quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      measurementValue: PropTypes.string,
    })
  ).isRequired,
  onDataChange: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
  onTableErrorChange: PropTypes.func,
};

export default ExcelDataTable;
