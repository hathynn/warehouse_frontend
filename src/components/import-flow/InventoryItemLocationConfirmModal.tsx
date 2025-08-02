import React, { useState } from 'react';
import { Modal, Button, Checkbox } from 'antd';

interface InventoryItemLocationConfirmModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const InventoryItemLocationConfirmModal: React.FC<InventoryItemLocationConfirmModalProps> = ({
  open,
  loading,
  onClose,
  onConfirm,
}) => {
  const [locationConfirmResponsibilityChecked, setLocationConfirmResponsibilityChecked] = useState(false);

  const handleClose = () => {
    setLocationConfirmResponsibilityChecked(false);
    onClose();
  }

  const handleConfirm = () => {
    onConfirm();
    setLocationConfirmResponsibilityChecked(false);
  }

  return (
    <Modal
      title={
        <div className="text-center">
          <h3 className="text-lg font-bold">Tiến hành xác nhận vị trí lưu kho</h3>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          disabled={!locationConfirmResponsibilityChecked}
          loading={loading}
          onClick={handleConfirm}
        >
          Tôi xác nhận vị trí lưu kho
        </Button>
      ]}
      width={500}
      centered
      maskClosable={!loading}
    >
      <div className="py-4">
        <div className="pt-4 border-t border-gray-200">
          <Checkbox
            checked={locationConfirmResponsibilityChecked}
            onChange={(e) => setLocationConfirmResponsibilityChecked(e.target.checked)}
            className="text-sm"
            disabled={loading}
          >
            <span className='font-bold'>
              Tôi đã kiểm tra kỹ và xác nhận các vị trí lưu kho là đúng.
            </span>
          </Checkbox>
        </div>
      </div>
    </Modal>
  );
};

export default InventoryItemLocationConfirmModal;