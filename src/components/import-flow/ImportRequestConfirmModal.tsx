import React, { useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox } from "antd";
interface ImportRequestDetailRow {
  itemId: number;
  quantity: number;
  itemName: string;
  measurementUnit?: string;
  totalMeasurementValue?: number;
}

interface ImportRequestConfirmModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
  formData: {
    importReason: string;
    importType: string;
  };
  details: ImportRequestDetailRow[];
  providers: Record<number, string>;
}

const ImportRequestConfirmModal: React.FC<ImportRequestConfirmModalProps> = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  formData,
  details,
  providers,
}) => {
  const [confirmCreateImportRequestChecked, setConfirmCreateImportRequestChecked] = useState(false);

  const columns = [
    { title: "Tên hàng hóa", dataIndex: "itemName", key: "itemName" },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
    { title: "Giá trị đo lường", dataIndex: "totalMeasurementValue", key: "totalMeasurementValue" },
    { title: "Đơn vị tính", dataIndex: "measurementUnit", key: "measurementUnit" },
    { title: "Nhà cung cấp", dataIndex: "providerId", key: "providerId", render: (id: number) => providers[id] || "-" },
  ];

  return (
    <Modal
      title={<Typography.Title level={4}>Xác nhận thông tin phiếu nhập</Typography.Title>}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Xác nhận tạo phiếu"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      width={800}
      maskClosable={false}
      okButtonProps={{ disabled: !confirmCreateImportRequestChecked, danger: true }}
    >
      <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Lý do nhập">{formData.importReason}</Descriptions.Item>
        <Descriptions.Item label="Loại nhập">{formData.importType === "ORDER" ? "Nhập theo đơn" : "Nhập trả hàng"}</Descriptions.Item>
      </Descriptions>
      <Typography.Title level={5} style={{ marginBottom: 12 }}>Danh sách hàng hóa</Typography.Title>
      <Table
        columns={columns}
        dataSource={details}
        rowKey={(record) => `${record.itemId}`}
        pagination={false}
        size="small"
        bordered
      />
      <Checkbox checked={confirmCreateImportRequestChecked} onChange={e => setConfirmCreateImportRequestChecked(e.target.checked)} style={{ marginTop: 8, fontSize: 14, fontWeight: "bold"}}>
        Tôi sẵn sàng chịu trách nhiệm về quyết định tạo phiếu nhập này.
      </Checkbox>
      <div className="text-red-500">
        Vui lòng kiểm tra kỹ trước khi xác nhận!
      </div>
    </Modal>
  );
};

export default ImportRequestConfirmModal;
