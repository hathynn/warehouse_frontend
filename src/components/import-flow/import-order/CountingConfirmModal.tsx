import React, { useState } from 'react';
import { Modal, Button, Checkbox, Table } from 'antd';
import { ImportOrderDetailResponse } from '@/services/useImportOrderDetailService';

interface CountingConfirmModalProps {
  open: boolean;
  loading: boolean;
  importOrderDetails: ImportOrderDetailResponse[];
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isReturnImport?: boolean;
}

const CountingConfirmModal: React.FC<CountingConfirmModalProps> = ({
  open,
  loading,
  importOrderDetails,
  onClose,
  onConfirm,
  isReturnImport = false,
}) => {
  const [countingConfirmResponsibilityChecked, setCountingConfirmResponsibilityChecked] = useState(false);

  const handleClose = () => {
    setCountingConfirmResponsibilityChecked(false);
    onClose();
  }

  const handleConfirm = () => {
    onConfirm();
    setCountingConfirmResponsibilityChecked(false);
  }

  return (
    <Modal
      title="Xác nhận kiểm đếm"
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          disabled={!countingConfirmResponsibilityChecked}
          loading={loading}
          onClick={handleConfirm}
        >
          Tôi xác nhận kiểm đếm
        </Button>
      ]}
      width={480}
      maskClosable={!loading}
    >
      <div className="space-y-4">
        <Table
          columns={[
            {
              title: "Tên sản phẩm",
              dataIndex: "itemName",
              key: "itemName",
              width: "50%",
              align: "left" as const,
              ellipsis: true,
              onHeaderCell: () => ({
                style: { textAlign: 'center' as const }
              })
            },
            {
              title: "Thực tế",
              key: isReturnImport ? "actualMeasurementValue" : "actualQuantity",
              dataIndex: isReturnImport ? "actualMeasurementValue" : "actualQuantity",
              width: "25%",
              align: "right" as const,
              onHeaderCell: () => ({
                style: { textAlign: 'center' as const }
              })
            },
            {
              title: "Dự kiến",
              key: isReturnImport ? "expectMeasurementValue" : "expectQuantity",
              dataIndex: isReturnImport ? "expectMeasurementValue" : "expectQuantity",
              width: "25%",
              align: "right" as const,
              onHeaderCell: () => ({
                style: { textAlign: 'center' as const }
              })
            }
          ]}
          dataSource={importOrderDetails}
          rowKey="importOrderDetailId"
          size="small"
          pagination={false}
        />
        <Checkbox
          checked={countingConfirmResponsibilityChecked}
          onChange={(e) => setCountingConfirmResponsibilityChecked(e.target.checked)}
          className="text-sm"
          disabled={loading}
        >
          <span className='font-bold'>
            Tôi xác nhận những thông tin trên là đúng.
          </span>
        </Checkbox>
      </div>
    </Modal>
  );
};

export default CountingConfirmModal;