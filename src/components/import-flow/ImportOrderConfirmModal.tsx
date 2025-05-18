import React, { useEffect, useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox, TablePaginationConfig } from "antd";
import dayjs from "dayjs";
import { ImportOrderDetailRow } from "./EditableImportOrderTableSection";
import { usePaginationViewTracker } from "../../hooks/usePaginationViewTracker";

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
  importRequestProvider?: string;
}

const ImportOrderConfirmModal: React.FC<ImportOrderConfirmModalProps> = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  formData,
  details,
  importRequestProvider,
}) => {
  const [confirmCreateImportOrderChecked, setConfirmCreateImportOrderChecked] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: details.length,
  });

  const { allPagesViewed, markPageAsViewed } = usePaginationViewTracker(
    details.length,
    pagination.pageSize,
    pagination.current
  );

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 5,
    });
    if (newPagination.current) {
      markPageAsViewed(newPagination.current);
    }
  };

  useEffect(() => {
    if (!open) {
      setConfirmCreateImportOrderChecked(false);
    }
  }, [open]);

  const columns = [
    { 
      title: "Mã hàng", 
      dataIndex: "itemId", 
      key: "itemId", 
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (id: number) => `#${id}` 
    },
    { 
      width: "30%",
      title: "Tên hàng", 
      dataIndex: "itemName", 
      key: "itemName",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    { 
      title: "Dự nhập theo phiếu", 
      dataIndex: "expectQuantity", 
      key: "expectQuantity",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    { 
      title: "Thực tế đã nhập", 
      dataIndex: "actualQuantity", 
      key: "actualQuantity",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    { 
      title: "Dự nhập đơn này", 
      dataIndex: "plannedQuantity", 
      key: "plannedQuantity",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
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
      width={960}
      maskClosable={false}
      okButtonProps={{ disabled: !confirmCreateImportOrderChecked, danger: false }}
    >
      <Descriptions bordered column={2} size="small" labelStyle={{ fontWeight: "bold" }} style={{ marginBottom: 24 }}>
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
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: details.length,
          showTotal: (total) => `Tổng ${total} mục`,
        }}
        onChange={handleTableChange}
        size="small"
        bordered
        style={{ height: "350px", overflowY: "auto" }}
      />
      <Checkbox 
        checked={confirmCreateImportOrderChecked} 
        onChange={e => setConfirmCreateImportOrderChecked(e.target.checked)} 
        style={{ marginTop: 8, fontSize: 14, fontWeight: "bold"}}
        disabled={!allPagesViewed}
      >
        Tôi đã kiểm tra và xác nhận đơn nhập trên đầy đủ thông tin.
        {!allPagesViewed && <span style={{ color: 'red', marginLeft: 8 }}>(Vui lòng xem tất cả các trang)</span>}
      </Checkbox>
    </Modal>
  );
};

export default ImportOrderConfirmModal;
