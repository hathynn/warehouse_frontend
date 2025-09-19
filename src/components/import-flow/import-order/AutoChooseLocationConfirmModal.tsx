import React, { useEffect, useState } from 'react';
import { Modal, Button, Checkbox, Table } from 'antd';
import { useScrollViewTracker } from "@/hooks/useScrollViewTracker";
import { InventoryItemResponse } from '@/services/useInventoryItemService';
import { ImportOrderDetailResponse } from '@/services/useImportOrderDetailService';

interface AutoChooseLocationConfirmModalProps {
  open: boolean;
  loading?: boolean;
  inventoryItems: InventoryItemResponse[];
  importOrderDetails: ImportOrderDetailResponse[];
  isReturnImport: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const AutoChooseLocationConfirmModal: React.FC<AutoChooseLocationConfirmModalProps> = ({
  open,
  loading = false,
  inventoryItems,
  importOrderDetails,
  isReturnImport,
  onClose,
  onConfirm,
}) => {
  const [confirmChecked, setConfirmChecked] = useState(false);
  const { scrollContainerRef, checkScrollPosition, hasScrolledToBottom, resetScrollTracking } = useScrollViewTracker(5);

  useEffect(() => {
    if (!open) {
      resetScrollTracking();
      setConfirmChecked(false);
    }
  }, [open, resetScrollTracking]);

  useEffect(() => {
    if (open && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      if (container.scrollHeight <= container.clientHeight) {
        setTimeout(() => checkScrollPosition(), 100);
      }
    }
  }, [open, inventoryItems, importOrderDetails, checkScrollPosition]);

  const handleClose = () => {
    setConfirmChecked(false);
    onClose();
  };

  const handleConfirm = async () => {
    await onConfirm();
    setConfirmChecked(false);
  };

  // Data to display based on import type
  const dataToDisplay = isReturnImport ? inventoryItems : importOrderDetails;

  const getColumns = () => {
    if (isReturnImport) {
      return [
        {
          title: "Mã sản phẩm tồn kho",
          dataIndex: "id",
          key: "id",
          render: (id: string) => `#${id}`,
          width: "40%",
          align: "left" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          })
        },
        {
          title: "Tên sản phẩm",
          dataIndex: "itemName",
          key: "itemName",
          width: "60%",
          align: "left" as const,
          ellipsis: true,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          })
        }
      ];
    } else {
      return [
        {
          title: "Mã sản phẩm",
          dataIndex: "itemId",
          key: "itemId",
          render: (id: number) => `#${id}`,
          width: "40%",
          align: "left" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          })
        },
        {
          title: "Tên sản phẩm",
          dataIndex: "itemName",
          key: "itemName",
          width: "60%",
          align: "left" as const,
          ellipsis: true,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          })
        }
      ];
    }
  };

  const getRowKey = (record: any) => {
    return isReturnImport ? record.id : record.itemId;
  };

  return (
    <Modal
      title="Xác nhận cập nhật vị trí tự động"
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          disabled={!confirmChecked || !hasScrolledToBottom}
          loading={loading}
          onClick={handleConfirm}
        >
          Cập nhật vị trí tự động
        </Button>
      ]}
      maskClosable={!loading}
      width={600}
    >
      <div className="space-y-4">
        <p className="mb-4">Các sản phẩm sau sẽ được cập nhật vị trí lưu kho tự động:</p>
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          style={{ height: "300px", overflowY: "auto" }}
        >
          <Table
            columns={getColumns()}
            dataSource={dataToDisplay}
            rowKey={getRowKey}
            size="small"
            pagination={false}
            bordered
          />
        </div>
        <Checkbox
          checked={confirmChecked}
          onChange={(e) => setConfirmChecked(e.target.checked)}
          className="text-sm"
          disabled={!hasScrolledToBottom || loading}
        >
          <span className='font-bold'>
            Tôi đồng ý cập nhật vị trí tự động cho các sản phẩm trên.
            {!hasScrolledToBottom && <span style={{ color: 'red', marginLeft: 8 }}>(Vui lòng xem hết danh sách)</span>}
          </span>
        </Checkbox>
      </div>
    </Modal>
  );
};

export default AutoChooseLocationConfirmModal;