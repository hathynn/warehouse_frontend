import React, { useEffect, useState } from "react";
import { Card, Form, InputNumber, TimePicker, Button, Spin, Tooltip } from "antd";
import { SaveOutlined, InfoCircleOutlined } from "@ant-design/icons";
import useConfigurationService, { ConfigurationDto } from "@/hooks/useConfigurationService";
import dayjs from "dayjs";

const fieldDescriptions = {
  workingTimeStart: "Thời gian bắt đầu ca làm việc trong ngày của nhân viên (định dạng HH:mm).",
  workingTimeEnd: "Thời gian kết thúc ca làm việc trong ngày của nhân viên (định dạng HH:mm).",
  createRequestTimeAtLeast: "Khoảng thời gian tối thiểu (tính bằng giờ) từ lúc tạo đơn đến lúc nhận hàng. Ví dụ: Nếu đặt là 4, bạn chỉ có thể chọn nhận hàng sau ít nhất 4 giờ kể từ bây giờ.",
  timeToAllowAssign: "Số giờ trước khi nhận hàng mà bạn có thể thay đổi nhân viên được phân công. Sau thời gian này, không thể thay đổi nhân viên nữa. Ví dụ: Nếu đặt là 2, bạn chỉ có thể đổi nhân viên trước giờ nhận hàng 2 tiếng.",
  timeToAllowConfirm: "Khoảng thời gian cho phép xác nhận công việc từ thời điểm nhận hàng",
};

const getLabel = (label: string, field: keyof typeof fieldDescriptions) => (
  <span style={{ fontSize: 16, fontWeight: 500 }}>
    {label}
    <Tooltip
      title={fieldDescriptions[field]}
      overlayStyle={{ maxWidth: 500 }}
    >
      <InfoCircleOutlined style={{ marginLeft: 6, color: "#1890ff" }} />
    </Tooltip>
  </span>
);

const ConfigurationPage: React.FC = () => {
  const [form] = Form.useForm();
  const { getConfiguration, saveConfiguration, loading } = useConfigurationService();
  const [initialConfig, setInitialConfig] = useState<ConfigurationDto | null>(null);

  useEffect(() => {
    (async () => {
      const config = await getConfiguration();
      if (config) {
        setInitialConfig(config);
        form.setFieldsValue({
          ...config,
          workingTimeStart: dayjs(config.workingTimeStart, "HH:mm"),
          workingTimeEnd: dayjs(config.workingTimeEnd, "HH:mm"),
          createRequestTimeAtLeast: config.createRequestTimeAtLeast
            ? Number(config.createRequestTimeAtLeast.split(":")[0])
            : undefined,
          timeToAllowAssign: config.timeToAllowAssign
            ? Number(config.timeToAllowAssign.split(":")[0])
            : undefined,
          timeToAllowConfirm: config.timeToAllowConfirm
            ? Number(config.timeToAllowConfirm.split(":")[0])
            : undefined,
        });
      }
    })();
  }, [form]);

  const onFinish = async (values: any) => {
    const payload: ConfigurationDto = {
      ...initialConfig,
      ...values,
      workingTimeStart: values.workingTimeStart.format("HH:mm"),
      workingTimeEnd: values.workingTimeEnd.format("HH:mm"),
      createRequestTimeAtLeast: values.createRequestTimeAtLeast
        ? values.createRequestTimeAtLeast.toString().padStart(2, "0") + ":00"
        : undefined,
      timeToAllowAssign: values.timeToAllowAssign
        ? values.timeToAllowAssign.toString().padStart(2, "0") + ":00"
        : undefined,
      timeToAllowConfirm: values.timeToAllowConfirm
        ? values.timeToAllowConfirm.toString().padStart(2, "0") + ":00"
        : undefined,
    };
    await saveConfiguration(payload);
  };

  return (
    <div className="container mx-auto p-5">
      <Card title={<span style={{ fontSize: 18, fontWeight: 600 }}>Cấu hình hệ thống</span>} bordered>
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              label={getLabel("Giờ bắt đầu ca làm việc", "workingTimeStart")}
              name="workingTimeStart"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <TimePicker
                format="HH:mm"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={getLabel("Giờ kết thúc ca làm việc", "workingTimeEnd")}
              name="workingTimeEnd"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <TimePicker
                format="HH:mm"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={getLabel("Thời gian đặt trước tối thiểu", "createRequestTimeAtLeast")}
              name="createRequestTimeAtLeast"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <InputNumber
                min={1}
                step={1}
                addonAfter="giờ"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={getLabel("Thời hạn phân công lại nhân viên", "timeToAllowAssign")}
              name="timeToAllowAssign"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <InputNumber
                min={1}
                step={1}
                addonAfter="giờ"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={getLabel("Khoảng thời gian cho phép xác nhận công việc", "timeToAllowConfirm")}
              name="timeToAllowConfirm"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <InputNumber
                min={1}
                step={1}
                addonAfter="giờ"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ fontSize: 16, padding: '0 20px' }}>
                Lưu cấu hình
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default ConfigurationPage;
