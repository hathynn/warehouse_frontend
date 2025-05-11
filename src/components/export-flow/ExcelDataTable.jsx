import React, { useState } from "react";
import { Table, Input, Space, Button, Popconfirm, InputNumber } from "antd";
import {
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";

const ExcelDataTable = ({ data, onDataChange, items }) => {
  const [editIndex, setEditIndex] = useState(null);
  const [editQuantity, setEditQuantity] = useState(null);
  const [maxAvailableQuantity, setMaxAvailableQuantity] = useState(null);
  const [fieldError, setFieldError] = useState("");

  const handleEdit = (index, quantity) => {
    const currentItem = data[index];
    const itemMeta = items.find((i) => i.id === currentItem.itemId);
    const maxValue = itemMeta?.totalMeasurementValue ?? Infinity;
    setEditIndex(index);
    setEditQuantity(quantity);
    setMaxAvailableQuantity(maxValue);
  };

  const handleSave = (index) => {
    const value = Number(editQuantity);
    if (isNaN(value) || value <= 0) {
      return setFieldError("Phải lớn hơn 0");
    }

    const currentItem = data[index];
    const itemMeta = items.find((item) => item.id === currentItem.itemId);
    const maxValue = itemMeta?.totalMeasurementValue ?? Infinity;

    if (value > maxValue) {
      return setFieldError(`Tối đa còn ${maxValue}`);
    }

    setFieldError(""); // xoá lỗi khi hợp lệ

    const newData = data.map((item, idx) =>
      idx === index ? { ...item, quantity: value } : item
    );
    onDataChange(newData);
    setEditIndex(null);
    setEditQuantity(null);
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditQuantity(null);
    setFieldError("");
  };

  const handleDelete = (index) => {
    const newData = data.filter((_, idx) => idx !== index);
    onDataChange(newData);
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
      render: (text, record, index) =>
        editIndex === index ? (
          <>
            <Input
              type="number"
              value={editQuantity}
              onChange={(e) => {
                const v = e.target.value;
                setEditQuantity(v);

                // validate realtime
                if (v === "") return setFieldError("Vui lòng nhập số!");
                if (!/^\d+$/.test(v)) {
                  return setFieldError("Không nhập chữ!");
                }
                const num = Number(v);

                if (isNaN(num) || num <= 0) {
                  return setFieldError("Phải lớn hơn 0!");
                }
                if (num > maxAvailableQuantity) {
                  return setFieldError(`Tối đa còn ${maxAvailableQuantity}!`);
                }
                setFieldError("");
              }}
              style={{ width: 75 }}
              status={
                fieldError ? "error" : undefined // chỉ đỏ khi có lỗi
              }
            />
            {fieldError && (
              <div className="text-red-500 text-xs mt-1">{fieldError}</div>
            )}
          </>
        ) : (
          <div className="pl-12 text-right">{text}</div>
        ),
    },
    {
      title: "Quy cách",
      dataIndex: "measurementValue",
      key: "measurementValue",
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      render: (_, record, index) => (
        <Space>
          {editIndex === index ? (
            <>
              <Button
                icon={<CheckOutlined />}
                type="link"
                disabled={!!fieldError || editQuantity === null}
                onClick={() => handleSave(index)}
              />
              <Button
                icon={<CloseOutlined />}
                type="link"
                onClick={handleCancel}
              />
            </>
          ) : (
            <>
              <Button
                icon={<EditOutlined />}
                type="link"
                onClick={() => handleEdit(index, record.quantity)}
              />
              <Popconfirm
                title="Bạn chắc chắn muốn xóa dòng này?"
                onConfirm={() => handleDelete(index)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button icon={<DeleteOutlined />} type="link" danger />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey={(_, index) => index}
      pagination={{ pageSize: 10 }}
    />
  );
};

ExcelDataTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.number,
      itemName: PropTypes.string,
      quantity: PropTypes.number,
      measurementValue: PropTypes.string,
    })
  ).isRequired,
  onDataChange: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
};

export default ExcelDataTable;
