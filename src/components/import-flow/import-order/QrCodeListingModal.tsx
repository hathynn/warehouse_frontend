import React from 'react';
import { Modal, Button, Spin } from 'antd';
import QRCode from 'react-qr-code';
import { InventoryItemResponse } from '@/services/useInventoryItemService';

interface QrCodeListingModalProps {
  open: boolean;
  loading: boolean;
  inventoryItems: InventoryItemResponse[];
  onClose: () => void;
}

const QrCodeListingModal: React.FC<QrCodeListingModalProps> = ({
  open,
  loading,
  inventoryItems,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      title={<span className="text-lg font-bold">Danh sách QRCode sản phẩm</span>}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} disabled={loading}>
          Đóng
        </Button>,
        <Button 
          key="print" 
          type="primary" 
          onClick={handlePrint} 
          disabled={loading || inventoryItems.length === 0}
        >
          In
        </Button>,
      ]}
      width={1080}
      className="!top-[50px] print:!block"
      maskClosable={!loading}
    >
      <div id="qr-print-area" className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 md:grid-cols-4 print:grid-cols-4 print:gap-4">
        {loading ? (
          <div className="flex items-center justify-center col-span-3 py-8">
            <Spin size="large" />
          </div>
        ) : inventoryItems.length === 0 ? (
          <div className="col-span-3 py-8 text-center text-gray-500">Không có QRCode nào để in</div>
        ) : (
          inventoryItems.map((invItem) => (
            <div key={invItem.id} className="flex flex-col items-center p-4 bg-white border rounded-lg print:shadow-none print:border print:p-2">
              <QRCode value={invItem.id.toString()} size={96} />
              <div className="mt-2 text-xs text-center">#{invItem.id || '-'}</div>
              {invItem.parentId && (
                <div className="text-xs text-gray-700">Mã cũ: #{invItem.parentId}</div>
              )}
              <div className="mt-1 text-xs">Mã mặt hàng: {invItem.itemId}</div>
              <div className="text-sm text-gray-700">{invItem.itemName || '-'}</div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default QrCodeListingModal;