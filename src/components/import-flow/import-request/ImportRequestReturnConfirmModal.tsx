import React, { useEffect, useState } from "react";
import { Modal, Typography, Descriptions, Table, Checkbox } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import dayjs from "dayjs";
import { useScrollViewTracker } from "@/hooks/useScrollViewTracker";

interface ReturnImportDetailRow {
  inventoryItemId: string;
  measurementValue: number;
}

interface ImportRequestReturnConfirmModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
  formData: {
    importReason: string;
    importType: string;
    startDate: string;
    endDate: string;
    departmentId: number | null;
  };
  details: ReturnImportDetailRow[];
  departmentName: string;
}

const ImportRequestReturnConfirmModal: React.FC<ImportRequestReturnConfirmModalProps> = ({
  open,
  onOk,
  onCancel,
  confirmLoading,
  formData,
  details,
  departmentName,
}) => {
  const [confirmCreateImportRequestChecked, setConfirmCreateImportRequestChecked] = useState(false);
  
  const { scrollContainerRef, checkScrollPosition, hasScrolledToBottom, resetScrollTracking } = useScrollViewTracker(5);

  const sortedDetails = [...details].sort((a, b) => a.inventoryItemId.localeCompare(b.inventoryItemId));

  useEffect(() => {
    if (!open) {
      resetScrollTracking();
      setConfirmCreateImportRequestChecked(false);
    }
  }, [open, resetScrollTracking]);

  const columns = [
    {
      title: "Mã sản phẩm tồn kho",
      dataIndex: "inventoryItemId",
      key: "inventoryItemId",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: "Giá trị cần nhập",
      dataIndex: "measurementValue",
      key: "measurementValue",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
  ];

  return (
    <Modal
      title={<Typography.Title level={4}>Xác nhận thông tin phiếu nhập trả</Typography.Title>}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      width={960}
      maskClosable={false}
      okButtonProps={{ disabled: !confirmCreateImportRequestChecked, danger: false }}
    >
      <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }} labelStyle={{ width: "20%", fontWeight: "bold" }} className="[&_.ant-descriptions-view]:!border-gray-400 [&_.ant-descriptions-view_table]:!border-gray-400 [&_.ant-descriptions-view_table_th]:!border-gray-400 [&_.ant-descriptions-view_table_td]:!border-gray-400 [&_.ant-descriptions-row]:!border-gray-400">
        <Descriptions.Item label="Lý do nhập" span={2}>
          <div className="max-h-[48px] overflow-y-auto leading-[24px]">
            {formData.importReason}
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Loại nhập" span={1}>
          Nhập trả hàng
        </Descriptions.Item>
        <Descriptions.Item label="Phòng ban" span={1}>
          {departmentName}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày có hiệu lực">
          {formData.startDate ? dayjs(formData.startDate).format("DD-MM-YYYY") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày hết hạn">
          {formData.endDate ? dayjs(formData.endDate).format("DD-MM-YYYY") : "-"}
        </Descriptions.Item>
      </Descriptions>
      
      <Typography.Title level={5} style={{ marginBottom: 12 }}>Danh sách hàng hóa trả</Typography.Title>
      
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollPosition}
        style={{ height: "540px", overflowY: "auto" }}
      >
        <Table
          columns={columns}
          dataSource={sortedDetails}
          rowKey={(record, index) => `${record.inventoryItemId}-${index}`}
          pagination={false}
          size="small"
          bordered
          className="[&_.ant-table-cell]:!border-gray-400 [&_.ant-table-thead>tr>th]:!border-gray-400 [&_.ant-table-tbody>tr>td]:!border-gray-400 [&_.ant-table-container]:!border-gray-400"
        />
      </div>
      
      <Checkbox
        checked={confirmCreateImportRequestChecked}
        onChange={(e: CheckboxChangeEvent) => setConfirmCreateImportRequestChecked(e.target.checked)}
        style={{ marginTop: 8, fontSize: 14, fontWeight: "bold" }}
        disabled={!hasScrolledToBottom}
      >
        Tôi xác nhận thông tin phiếu nhập trả trên là đúng và đồng ý tạo.
        {!hasScrolledToBottom && <span style={{ color: 'red', marginLeft: 8 }}>(Vui lòng xem hết trang)</span>}
      </Checkbox>
    </Modal>
  );
};

export default ImportRequestReturnConfirmModal;