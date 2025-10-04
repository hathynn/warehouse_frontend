import React, { useState } from 'react';
import { Modal, Button, Input, Table, Spin } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { ImportOrderResponse } from '@/services/useImportOrderService';
import { AccountResponse } from '@/services/useAccountService';

interface ImportOrderAssignStaffModalProps {
  open: boolean;
  loading: boolean;
  accountLoading: boolean;
  importOrderData: ImportOrderResponse;
  assignedStaff: AccountResponse | null;
  staffs: AccountResponse[];
  remainingAssignTime: string | null;
  onClose: () => void;
  onAssign: (staffId: number) => Promise<void>;
}

const ImportOrderAssignStaffModal: React.FC<ImportOrderAssignStaffModalProps> = ({
  open,
  loading,
  accountLoading,
  importOrderData,
  assignedStaff,
  staffs,
  remainingAssignTime,
  onClose,
  onAssign,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');

  const handleClose = () => {
    setSelectedStaffId(null);
    setSearchText('');
    onClose();
  };

  const handleSelectStaff = (staffId: number) => {
    setSelectedStaffId(staffId);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleAssign = async () => {
    if (!selectedStaffId) return;
    await onAssign(selectedStaffId);
    setSelectedStaffId(null);
    setSearchText('');
  };

  const calculateRemainingTime = (totalExpectedTime: string, defaultWorkingMinutes: number): string => {
    try {
      const [hours, minutes] = totalExpectedTime.split(':').map(Number);
      const expectedMinutes = (hours * 60) + minutes;
      const remainingMinutes = defaultWorkingMinutes - expectedMinutes;
      if (remainingMinutes <= 0) return "0 tiếng 0 phút";
      const remainingHours = Math.floor(remainingMinutes / 60);
      const remainingMins = Math.floor(remainingMinutes % 60);
      return `${remainingHours} tiếng ${remainingMins} phút`;
    } catch (error) {
      return `${Math.floor(defaultWorkingMinutes / 60)} tiếng ${defaultWorkingMinutes % 60} phút`;
    }
  };

  const getDefaultWorkingMinutes = () => {
    return 480; // 8 hours fallback
  };

  const filteredAndSortedStaffs = staffs
    .map(staff => ({
      ...staff,
      remainingTime: calculateRemainingTime(
        staff.totalExpectedWorkingTimeOfRequestInDay || "00:00:00",
        getDefaultWorkingMinutes()
      )
    }))
    .filter(staff => {
      if (staff.id === importOrderData?.assignedStaffId) return false;
      const searchLower = searchText.toLowerCase();
      return (
        staff.fullName.toLowerCase().includes(searchLower) ||
        staff.id.toString().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const getMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(' tiếng ').map(part =>
          parseInt(part.replace(' phút', ''), 10)
        );
        return hours * 60 + minutes;
      };
      return getMinutes(b.remainingTime) - getMinutes(a.remainingTime);
    });

  return (
    <Modal
      title={
        <div className="!bg-blue-50 -mx-6 -mt-6 px-6 py-4 border-b rounded-t-lg">
          <h3 className="text-xl font-semibold text-blue-900">Phân công nhân viên kho</h3>
          <p className="mt-1 text-lg text-blue-700">Đơn nhập #{importOrderData?.importOrderId}</p>
          <p className="flex items-center mt-2 text-sm text-gray-700">
            <InfoCircleOutlined className="mr-2 text-blue-500" />
            Sau {remainingAssignTime || "..."},
            bạn sẽ không thể phân công lại nhân viên
          </p>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          Đóng
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleAssign}
          disabled={!selectedStaffId}
          loading={loading || accountLoading}
        >
          Phân công
        </Button>,
      ]}
      width={720}
      className="!top-[50px]"
      maskClosable={!loading}
    >
      {accountLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Assignment Info */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="mb-3 text-base font-medium text-gray-700">Nhân viên đang được phân công</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Mã nhân viên</p>
                <p className="text-base">#{assignedStaff?.id || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Họ tên</p>
                <p className="text-base">{assignedStaff?.fullName || "-"}</p>
              </div>
            </div>
          </div>

          {/* Staff List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-medium text-gray-700">Danh sách nhân viên có thể phân công</h4>
              <Input.Search
                placeholder="Tìm theo tên hoặc mã nhân viên"
                allowClear
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 300 }}
                value={searchText}
              />
            </div>
            <Table
              style={{
                height: "540px",
                overflowY: "auto"
              }}
              dataSource={filteredAndSortedStaffs}
              rowKey="id"
              pagination={false}
              className="!cursor-pointer [&_.ant-table-row:hover>td]:!bg-transparent"
              onRow={(record) => ({
                onClick: () => handleSelectStaff(record.id),
                className: selectedStaffId === record.id
                  ? '!bg-blue-100'
                  : ''
              })}
              columns={[
                {
                  title: "Mã nhân viên",
                  dataIndex: "id",
                  key: "id",
                  render: (id) => `#${id}`,
                  width: '25%',
                },
                {
                  title: "Họ tên",
                  dataIndex: "fullName",
                  key: "fullName",
                  width: '45%',
                },
                // {
                //   title: "Thời gian rảnh còn lại",
                //   dataIndex: "remainingTime",
                //   key: "remainingTime",
                //   width: '30%',
                //   render: (time, record) => (
                //     <span className={`font-medium ${record.id === importOrderData?.assignedStaffId ? 'text-gray-400' : 'text-blue-600'}`}>
                //       {time || "8 tiếng 0 phút"}
                //     </span>
                //   )
                // }
              ]}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ImportOrderAssignStaffModal;