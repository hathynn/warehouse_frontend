import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, message, InputNumber, Spin } from "antd";
import "./index.scss";
import useItemService from "../../../../hooks/useItemService";
import useProviderService from "../../../../hooks/useProviderService";

const { Option } = Select;
const { TextArea } = Input;

// Danh mục giả định (sau này sẽ được thay thế bằng API)
const fakeCategories = [
  { id: 1, name: "Vải thô" },
  { id: 2, name: "Phụ liệu may mặc" },
];

const ImportCreateProduct = () => {
  const [form] = Form.useForm();
  const [phone, setPhone] = useState("");
  const { createItem, loading: itemLoading } = useItemService();
  const { providers, getAllProviders, loading: providerLoading } = useProviderService();
  
  // Kết hợp trạng thái loading từ cả hai hook
  const loading = itemLoading || providerLoading;

  useEffect(() => {
    getAllProviders();
  }, []);

  const handleProviderChange = (value) => {
    const provider = providers.find((s) => s.id === value);
    const phoneNumber = provider ? provider.phone : "";
    setPhone(phoneNumber);
    form.setFieldsValue({ phone: phoneNumber });
  };

  const handleSubmit = async (values) => {
    try {
      // Chuyển đổi dữ liệu từ form sang định dạng ItemRequest
      const itemRequest = {
        name: values.name,
        description: values.description,
        measurementUnit: values.unit,
        unitType: values.unitType || "PIECE", // Mặc định là PIECE nếu không có
        totalMeasurementValue: values.totalMeasurementValue || 0,
        daysUntilDue: values.daysUntilDue || 30,
        minimumStockQuantity: values.minimumStockQuantity || 10,
        maximumStockQuantity: values.maximumStockQuantity || 100,
        categoryId: values.category,
        providerId: values.provider
      };

      await createItem(itemRequest);
      message.success("Sản phẩm đã được tạo thành công!");
      form.resetFields();
    } catch (error) {
      message.error("Không thể tạo sản phẩm. Vui lòng thử lại!");
      console.error("Error creating product:", error);
    }
  };

  return (
    <div className="product-form-container">
      <h2>Thêm Hàng Hóa Mới</h2>
      <Spin spinning={loading}>
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
                  {fakeCategories.map(category => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="description"
                label="Mô Tả"
                rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
              >
                <TextArea className="input-field" rows={4} />
              </Form.Item>

              <Form.Item
                name="unitType"
                label="Loại Đơn Vị"
                rules={[
                  { required: true, message: "Vui lòng chọn loại đơn vị!" },
                ]}
              >
                <Select className="input-field" placeholder="Chọn loại đơn vị">
                  <Option value="PIECE">Cái</Option>
                  <Option value="METER">Mét</Option>
                  <Option value="KILOGRAM">Kg</Option>
                  <Option value="LITER">Lít</Option>
                </Select>
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
                name="provider"
                label="Nhà Cung Cấp"
                rules={[
                  { required: true, message: "Vui lòng chọn nhà cung cấp!" },
                ]}
              >
                <Select
                  className="input-field"
                  onChange={handleProviderChange}
                  placeholder="Chọn nhà cung cấp"
                >
                  {providers.map((provider) => (
                    <Option key={provider.id} value={provider.id}>
                      {provider.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số Điện Thoại"
              >
                <Input className="input-field" readOnly />
              </Form.Item>

              <Form.Item
                name="minimumStockQuantity"
                label="Số Lượng Tối Thiểu"
                tooltip="Số lượng tối thiểu cần duy trì trong kho"
              >
                <InputNumber className="input-field" min={0} />
              </Form.Item>

              <Form.Item
                name="maximumStockQuantity"
                label="Số Lượng Tối Đa"
                tooltip="Số lượng tối đa có thể lưu trữ trong kho"
              >
                <InputNumber className="input-field" min={0} />
              </Form.Item>

              <Form.Item
                name="daysUntilDue"
                label="Số Ngày Hết Hạn"
                tooltip="Số ngày trước khi sản phẩm hết hạn"
              >
                <InputNumber className="input-field" min={0} />
              </Form.Item>
            </div>
          </div>

          <Form.Item>
            <Button className="submit-button" type="primary" htmlType="submit" loading={itemLoading}>
              Thêm Sản Phẩm
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
};

export default ImportCreateProduct;
