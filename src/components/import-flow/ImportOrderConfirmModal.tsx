import React, { useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox } from "antd";
import dayjs from "dayjs";
import { ImportOrderDetailRow } from "./EditableImportOrderTableSection";


interface ImportOrderConfirmModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
  formData: {
    dateReceived: string;
    timeReceived: string;
    note?: string;
    importRequestId: number | null;
  };
  details: ImportOrderDetailRow[];
  providers: Record<number, string>;
  importRequestProvider?: string;
}

const ImportOrderConfirmModal: React.FC<ImportOrderConfirmModalProps> = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  formData,
  details,
  providers,
  importRequestProvider,
}) => {
  const [confirmCreateImportOrderChecked, setConfirmCreateImportOrderChecked] = useState(false);

  const columns = [
    { 
      title: "Mã hàng", 
      dataIndex: "itemId", 
      key: "itemId", 
      align: "right" as const,
      render: (id: number) => `#${id}` 
    },
    { 
      title: "Tên hàng", 
      dataIndex: "itemName", 
      key: "itemName",
      width: "30%"
    },
    { 
      title: "Dự nhập theo phiếu", 
      dataIndex: "expectQuantity", 
      key: "expectQuantity",
      align: "right" as const
    },
    { 
      title: "Thực tế đã nhập", 
      dataIndex: "actualQuantity", 
      key: "actualQuantity",
      align: "right" as const
    },
    { 
      title: "Dự nhập đơn này", 
      dataIndex: "plannedQuantity", 
      key: "plannedQuantity",
      align: "right" as const,
      render: (_: any, record: ImportOrderDetailRow) => (
        <span className="font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-md inline-block" style={{ textAlign: 'right' }}>
          {record.plannedQuantity}
        </span>
      )
    }
  ];

  const formattedDate = formData.dateReceived 
    ? dayjs(formData.dateReceived).format("DD/MM/YYYY") 
    : "-";

  return (
    <Modal
      title={<Typography.Title level={4}>Xác nhận thông tin đơn nhập kho</Typography.Title>}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Xác nhận tạo đơn nhập"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      width={800}
      maskClosable={false}
      okButtonProps={{ disabled: !confirmCreateImportOrderChecked, danger: true }}
    >
      <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Mã phiếu nhập">#{formData.importRequestId}</Descriptions.Item>
        <Descriptions.Item label="Nhà cung cấp (theo phiếu nhập)">{importRequestProvider || "-"}</Descriptions.Item>
        <Descriptions.Item label="Ngày nhận hàng">{formattedDate}</Descriptions.Item>
        <Descriptions.Item label="Giờ nhận hàng">{formData.timeReceived || "-"}</Descriptions.Item>
        <Descriptions.Item label="Ghi chú" span={2}>{formData.note || "-"}</Descriptions.Item>
      </Descriptions>
      <Typography.Title level={5} style={{ marginBottom: 12 }}>Danh sách hàng hóa nhập kho</Typography.Title>
      <Table
        columns={columns}
        dataSource={details}
        rowKey={(record) => `${record.itemId}`}
        pagination={false}
        size="small"
        bordered
      />
      <Checkbox 
        checked={confirmCreateImportOrderChecked} 
        onChange={e => setConfirmCreateImportOrderChecked(e.target.checked)} 
        style={{ marginTop: 16, fontSize: 14, fontWeight: "bold"}}
      >
        Tôi sẵn sàng chịu trách nhiệm về quyết định tạo đơn nhập kho này.
      </Checkbox>
      <div className="text-red-500 mt-2">
        Vui lòng kiểm tra kỹ thông tin trước khi xác nhận!
      </div>
    </Modal>
  );
};

export default ImportOrderConfirmModal;
