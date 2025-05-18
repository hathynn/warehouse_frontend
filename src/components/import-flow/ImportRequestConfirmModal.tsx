import React, { useEffect, useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox, TablePaginationConfig } from "antd";

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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: details.length,
  });

  useEffect(() => {
    if (!open) {
      setConfirmCreateImportRequestChecked(false);
    }
  }, [open]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
  };

  const columns = [
    { 
      title: "Tên hàng hóa", 
      dataIndex: "itemName", 
      key: "itemName",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    { 
      title: "Số lượng", 
      dataIndex: "quantity", 
      key: "quantity", 
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }), 
    },
    { 
      title: "Giá trị đo lường", 
      dataIndex: "totalMeasurementValue", 
      key: "totalMeasurementValue", 
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }), 
    },
    { 
      title: "Đơn vị tính", 
      dataIndex: "measurementUnit", 
      key: "measurementUnit", 
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }), 
    },
    { 
      title: "Nhà cung cấp", 
      dataIndex: "providerId", 
      key: "providerId", 
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }), 
      render: (id: number) => providers[id] || "-" 
    },
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
      width={960}
      maskClosable={false}
      okButtonProps={{ disabled: !confirmCreateImportRequestChecked, danger: false }}
    >
        <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }} labelStyle={{ width: "20%", fontWeight: "bold" }}>
          <Descriptions.Item label="Lý do nhập">
            <div className="max-h-[48px] overflow-y-auto leading-[24px]">
              {formData.importReason}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Loại nhập">
            {formData.importType === "ORDER" ? "Nhập theo đơn" : "Nhập trả hàng"}
          </Descriptions.Item>
        </Descriptions>
        <Typography.Title level={5} style={{ marginBottom: 12 }}>Danh sách hàng hóa</Typography.Title>
        <Table
          columns={columns}
          dataSource={details}
          rowKey={(record) => `${record.itemId}`}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: details.length,
            // showSizeChanger: true,
            // pageSizeOptions: ['5', '10', '20', '50'],
            // locale: {
            //   items_per_page: "/ trang"
            // },
            showTotal: (total) => `Tổng ${total} mục`,
          }}
          onChange={handleTableChange}
          size="small"
          bordered
          style={{ height: "490px", overflowY: "auto" }}
        />
        <Checkbox checked={confirmCreateImportRequestChecked} onChange={e => setConfirmCreateImportRequestChecked(e.target.checked)} style={{ marginTop: 8, fontSize: 14, fontWeight: "bold"}}>
          Tôi đã kiểm tra và xác nhận phiếu nhập trên đầy đủ thông tin.
        </Checkbox>
    </Modal>
  );
};

export default ImportRequestConfirmModal;
