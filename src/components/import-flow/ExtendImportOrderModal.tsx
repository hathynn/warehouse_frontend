import React, { useState, useEffect } from 'react';
import { Modal, Button, Checkbox, DatePicker, TimePicker, Input } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { ImportOrderResponse, ExtendImportOrderRequest } from '@/services/useImportOrderService';
import { ConfigurationDto } from '@/services/useConfigurationService';
import dayjs, { Dayjs } from 'dayjs';
import {
  getDefaultAssignedDateTimeForAction,
  isDateDisabledForAction,
  getDisabledTimeConfigForAction
} from '@/utils/helpers';

const { TextArea } = Input;

interface ExtendImportOrderModalProps {
  open: boolean;
  loading: boolean;
  importOrderData: ImportOrderResponse;
  configuration: ConfigurationDto | null;
  onClose: () => void;
  onConfirm: (extendRequest: ExtendImportOrderRequest) => Promise<void>;
}

const ExtendImportOrderModal: React.FC<ExtendImportOrderModalProps> = ({
  open,
  loading,
  importOrderData,
  configuration,
  onClose,
  onConfirm,
}) => {
  const [extendResponsibilityChecked, setExtendResponsibilityChecked] = useState(false);
  const [extendFormData, setExtendFormData] = useState<{
    extendedDate: string;
    extendedTime: string;
    extendedReason: string;
  }>({
    extendedDate: "",
    extendedTime: "",
    extendedReason: ""
  });

  useEffect(() => {
    if (open && configuration) {
      const defaultDateTime = getDefaultAssignedDateTimeForAction("extend-import-order", configuration);
      setExtendFormData({
        extendedDate: defaultDateTime.date,
        extendedTime: defaultDateTime.time,
        extendedReason: ""
      });
    }
  }, [open, configuration]);

  const handleClose = () => {
    setExtendResponsibilityChecked(false);
    setExtendFormData({
      extendedDate: "",
      extendedTime: "",
      extendedReason: ""
    });
    onClose();
  };

  const handleExtendDateChange = (date: Dayjs | null) => {
    if (!date) return;
    const newDate = date.format("YYYY-MM-DD");
    setExtendFormData(prev => ({
      ...prev,
      extendedDate: newDate
    }));
  };

  const handleExtendTimeChange = (time: Dayjs | null) => {
    if (!time) return;
    const newTime = time.format("HH:mm");
    setExtendFormData(prev => ({
      ...prev,
      extendedTime: newTime
    }));
  };

  const handleConfirm = () => {
    if (!importOrderData?.importOrderId || !extendFormData.extendedDate || !extendFormData.extendedTime || !extendFormData.extendedReason.trim()) {
      return;
    }

    if (!extendResponsibilityChecked) {
      return;
    }

    const extendRequest: ExtendImportOrderRequest = {
      importOrderId: importOrderData.importOrderId,
      extendedDate: extendFormData.extendedDate,
      extendedTime: extendFormData.extendedTime,
      extendedReason: extendFormData.extendedReason
    };
    
    onConfirm(extendRequest);
    handleClose();
  };

  return (
    <Modal
      title={
        <div className="!bg-blue-50 -mx-6 -mt-6 px-6 py-4 border-b rounded-t-lg">
          <h3 className="text-xl font-semibold text-blue-900">Gia hạn đơn nhập</h3>
          <p className="mt-1 text-lg text-blue-700">Đơn nhập #{importOrderData?.importOrderId}</p>
          <p className="flex items-center mt-2 text-sm text-gray-700">
            <InfoCircleOutlined className="mr-2 text-blue-500" />
            Thời gian gia hạn phải cách thời điểm hiện tại ít nhất {configuration?.daysToAllowExtend} ngày
          </p>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleConfirm}
          loading={loading}
          disabled={!extendFormData.extendedDate || !extendFormData.extendedTime || !extendFormData.extendedReason.trim() || !extendResponsibilityChecked}
        >
          Xác nhận gia hạn
        </Button>,
      ]}
      width={540}
      className="!top-[50px]"
      maskClosable={!loading}
    >
      <div className="pt-4 space-y-6">
        {/* Thông tin hiện tại */}
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="mb-3 text-base font-medium text-gray-700">Thông tin hiện tại</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Ngày nhận hiện tại</p>
              <p className="text-base font-medium">
                {importOrderData?.dateReceived ? dayjs(importOrderData.dateReceived).format("DD-MM-YYYY") : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Giờ nhận hiện tại</p>
              <p className="text-base font-medium">
                {importOrderData?.timeReceived?.split(':').slice(0, 2).join(':') || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Form gia hạn */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 text-sm font-medium text-gray-700">
              Ngày nhận mới <span className="text-red-500">*</span>
            </label>
            <DatePicker
              className="w-full"
              format="DD-MM-YYYY"
              value={extendFormData.extendedDate ? dayjs(extendFormData.extendedDate) : null}
              onChange={handleExtendDateChange}
              disabledDate={(current) => isDateDisabledForAction(current, "extend-import-order", configuration)}
              showNow={false}
              placeholder="Chọn ngày nhận mới"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-2 text-sm font-medium text-gray-700">
              Giờ nhận mới <span className="text-red-500">*</span>
            </label>
            <TimePicker
              className="w-full"
              value={extendFormData.extendedTime ? dayjs(`1970-01-01 ${extendFormData.extendedTime}`) : null}
              onChange={handleExtendTimeChange}
              format="HH:mm"
              showNow={false}
              needConfirm={false}
              placeholder="Chọn giờ nhận mới"
              disabledTime={() => getDisabledTimeConfigForAction(extendFormData.extendedDate, "extend-import-order", configuration)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Lý do gia hạn <span className="text-red-500">*</span>
            </label>
            <TextArea
              className="!mb-2"
              rows={4}
              placeholder="Nhập lý do gia hạn đơn nhập..."
              value={extendFormData.extendedReason}
              onChange={(e) => setExtendFormData(prev => ({
                ...prev,
                extendedReason: e.target.value.slice(0, 200)
              }))}
              maxLength={200}
              showCount
              disabled={loading}
            />
          </div>
        </div>

        <Checkbox
          checked={extendResponsibilityChecked}
          onChange={e => setExtendResponsibilityChecked(e.target.checked)}
          className="text-sm"
          disabled={loading}
        >
          <span className='font-bold'>
            Tôi xác nhận đã điền đúng thông tin và đồng ý gia hạn.
          </span>
        </Checkbox>
      </div>
    </Modal>
  );
};

export default ExtendImportOrderModal;