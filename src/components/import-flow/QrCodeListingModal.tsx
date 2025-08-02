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
      width={900}
      className="!top-[50px] print:!block"
      maskClosable={!loading}
    >
      <div id="qr-print-area" className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3 print:gap-4">
        {loading ? (
          <div className="flex items-center justify-center col-span-3 py-8">
            <Spin size="large" />
          </div>
        ) : inventoryItems.length === 0 ? (
          <div className="col-span-3 py-8 text-center text-gray-500">Không có QRCode nào để in</div>
        ) : (
          inventoryItems.map((item) => (
            <div key={item.id} className="flex flex-col items-center p-4 bg-white border rounded-lg print:shadow-none print:border print:p-2">
              <QRCode value={item.id.toString()} size={128} />
              <div className="mt-2 text-base font-semibold">Mã sản phẩm: <span className="font-mono">#{item.itemId || '-'}</span></div>
              <div className="text-sm text-gray-700">Tên sản phẩm: {item.itemName || '-'}</div>
              <div className="mt-1 text-xs text-gray-500">ID QR: {item.id}</div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default QrCodeListingModal;