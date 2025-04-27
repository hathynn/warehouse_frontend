import React, { useEffect, useState } from "react";
import { Card, Form, Input, TimePicker, Button, Spin } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import useConfigurationService, { ConfigurationDto } from "@/hooks/useConfigurationService";
import dayjs from "dayjs";

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
          createRequestTimeAtLeast: config.createRequestTimeAtLeast?.slice(0, 5),
          timeToAllowAssign: config.timeToAllowAssign?.slice(0, 5),
          timeToAllowConfirm: config.timeToAllowConfirm?.slice(0, 5),
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
      createRequestTimeAtLeast: values.createRequestTimeAtLeast,
      timeToAllowAssign: values.timeToAllowAssign,
      timeToAllowConfirm: values.timeToAllowConfirm,
    };
    await saveConfiguration(payload);
  };

  return (
    <div className="container mx-auto p-5">
      <Card title="Cấu hình hệ thống" bordered>
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={initialConfig}
          >
            <Form.Item label="Thời gian bắt đầu làm việc" name="workingTimeStart" rules={[{ required: true, message: "Bắt buộc" }]}>
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item label="Thời gian kết thúc làm việc" name="workingTimeEnd" rules={[{ required: true, message: "Bắt buộc" }]}>
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item label="Thời gian tối thiểu tạo yêu cầu" name="createRequestTimeAtLeast" rules={[{ required: true, message: "Bắt buộc" }]}>
              <Input placeholder="VD: 01:00" />
            </Form.Item>
            <Form.Item label="Thời gian cho phép phân công" name="timeToAllowAssign" rules={[{ required: true, message: "Bắt buộc" }]}>
              <Input placeholder="VD: 01:00" />
            </Form.Item>
            <Form.Item label="Thời gian cho phép xác nhận" name="timeToAllowConfirm" rules={[{ required: true, message: "Bắt buộc" }]}>
              <Input placeholder="VD: 01:00" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
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