import React, { useState } from "react";
import { Form, Input, Select, Button, message } from "antd";
import "./index.scss";

const { Option } = Select;

const fakeSuppliers = [
  { id: 1, name: "Nhà cung cấp A", phone: "0901234567" },
  { id: 2, name: "Nhà cung cấp B", phone: "0907654321" },
  { id: 3, name: "Nhà cung cấp C", phone: "0912345678" },
];

const ProductForm = () => {
  const [form] = Form.useForm();
  const [phone, setPhone] = useState("");

  const handleSupplierChange = (value) => {
    const supplier = fakeSuppliers.find((s) => s.id === value);
    const phoneNumber = supplier ? supplier.phone : "";
    setPhone(phoneNumber);
    form.setFieldsValue({ phone: phoneNumber });
  };

  const handleSubmit = (values) => {
    message.success("Sản phẩm đã được tạo thành công!");
    console.log(values);
  };

  return (
    <div className="product-form-container">
      <h2>Thêm Hàng Hóa Mới</h2>
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <div className="form-columns">
          <div className="form-left">
            <Form.Item
              name="name"
              label="Tên Hàng"
              rules={[
                { required: true, message: "Vui lòng nhập tên sản phẩm!" },
              ]}
            >
              <Input className="input-field" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Danh Mục Hàng Hóa"
              rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
            >
              <Select className="input-field" placeholder="Chọn danh mục">
                <Option value="electronics">Vải</Option>
                <Option value="fashion">Phụ liệu</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô Tả"
              rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
            >
              <Input.TextArea className="input-field" />
            </Form.Item>
          </div>

          <div className="form-right">
            <Form.Item
              name="unit"
              label="Đơn Vị Tính"
              rules={[
                { required: true, message: "Vui lòng nhập đơn vị tính!" },
              ]}
            >
              <Input className="input-field" />
            </Form.Item>

            <Form.Item
              name="supplier"
              label="Nhà Cung Cấp"
              rules={[
                { required: true, message: "Vui lòng chọn nhà cung cấp!" },
              ]}
            >
              <Select
                className="input-field"
                onChange={handleSupplierChange}
                placeholder="Chọn nhà cung cấp"
              >
                {fakeSuppliers.map((supplier) => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số Điện Thoại"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
              ]}
            >
              <Input className="input-field" readOnly />
            </Form.Item>
          </div>
        </div>

        <Form.Item>
          <Button className="submit-button" type="primary" htmlType="submit">
            Thêm Sản Phẩm
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ProductForm;
