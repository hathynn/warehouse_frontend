import React from "react";
import PropTypes from "prop-types";
import { Modal, Button, Input, Table, Spin } from "antd";

const AssignKeeperStaffModal = ({
  visible,
  onCancel,
  onAssign,
  selectedKeeperId,
  setSelectedKeeperId,
  keeperStaffs,
  loadingStaff,
  assignedKeeper,
  exportRequest,
  exportRequestLoading,
  searchText,
  onSearch,
  calculateRemainingTime,
  getDefaultWorkingMinutes,
}) => {
  const getFilteredAndSortedKeeperStaffs = () => {
    const defaultWorkingMinutes = getDefaultWorkingMinutes();
    return keeperStaffs
      .map((staff) => ({
        ...staff,
        remainingTime: calculateRemainingTime(
          staff.totalExpectedWorkingTimeOfRequestInDay || "00:00:00",
          defaultWorkingMinutes
        ),
      }))
      .filter((staff) => {
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          staff.fullName.toLowerCase().includes(searchLower) ||
          staff.id.toString().includes(searchLower);

        // Bỏ nhân viên đã được phân công
        const isNotAssigned =
          staff.id !== exportRequest?.assignedWareHouseKeeperId;

        return matchesSearch && isNotAssigned;
      })
      .sort((a, b) => {
        // Convert remaining time to minutes for comparison
        const getMinutes = (timeStr) => {
          const [hours, minutes] = timeStr
            .split(" tiếng ")
            .map((part) => parseInt(part.replace(" phút", "")));
          return hours * 60 + minutes;
        };

        return getMinutes(b.remainingTime) - getMinutes(a.remainingTime);
      });
  };
  return (
    <Modal
      title={
        <div className="!bg-blue-50 -mx-6 -mt-4 px-6 py-4 border-b">
          <h3 className="text-xl font-semibold text-blue-900">
            Phân công nhân viên xuất hàng
          </h3>
          <p className="text-lg text-blue-700 mt-1">
            Phiếu xuất #{exportRequest?.exportRequestId}
          </p>
        </div>
      }
      open={visible}
      onCancel={() => {
        onCancel();
        setSelectedKeeperId(null);
      }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Đóng
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={onAssign}
          disabled={!selectedKeeperId}
          loading={exportRequestLoading}
        >
          Phân công
        </Button>,
      ]}
      width={700}
      className="!top-[50px]"
    >
      {loadingStaff ? (
        <div className="flex justify-center items-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Assignment Info */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="text-base font-medium text-gray-700 mb-3">
              Nhân viên đang được phân công xuất hàng
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Mã nhân viên</p>
                <p className="text-base">#{assignedKeeper?.id || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Họ tên</p>
                <p className="text-base">{assignedKeeper?.fullName || "-"}</p>
              </div>
            </div>
          </div>

          {/* Staff List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-medium text-gray-700">
                Danh sách nhân viên có thể phân công
              </h4>
              <Input.Search
                placeholder="Tìm theo tên hoặc mã nhân viên"
                allowClear
                onSearch={onSearch}
                onChange={(e) => onSearch(e.target.value)}
                style={{ width: 300 }}
              />
            </div>
            <Table
              dataSource={getFilteredAndSortedKeeperStaffs()}
              rowKey="id"
              pagination={false}
              className="!cursor-pointer [&_.ant-table-row:hover>td]:!bg-transparent"
              onRow={(record) => ({
                onClick: () => setSelectedKeeperId(record.id),
                className: selectedKeeperId === record.id ? "!bg-blue-100" : "",
              })}
              columns={[
                {
                  title: "Mã nhân viên",
                  dataIndex: "id",
                  key: "id",
                  render: (id) => `#${id}`,
                  width: "25%",
                },
                {
                  title: "Họ tên",
                  dataIndex: "fullName",
                  key: "fullName",
                  width: "45%",
                },
                {
                  title: "Thời gian rảnh còn lại",
                  dataIndex: "remainingTime",
                  key: "remainingTime",
                  width: "30%",
                  render: (time) => (
                    <span className="font-medium text-blue-600">
                      {time || "8 tiếng 0 phút"}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

AssignKeeperStaffModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  selectedKeeperId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSelectedKeeperId: PropTypes.func.isRequired,
  keeperStaffs: PropTypes.arrayOf(PropTypes.object).isRequired,
  loadingStaff: PropTypes.bool.isRequired,
  assignedKeeper: PropTypes.object,
  exportRequest: PropTypes.object,
  exportRequestLoading: PropTypes.bool.isRequired,
  searchText: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
  calculateRemainingTime: PropTypes.func.isRequired,
  getDefaultWorkingMinutes: PropTypes.func.isRequired,
};

AssignKeeperStaffModal.defaultProps = {
  selectedKeeperId: null,
  assignedKeeper: null,
  exportRequest: null,
};

export default AssignKeeperStaffModal;
