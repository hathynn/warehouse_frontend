import React from "react";
import PropTypes from "prop-types";
import { Modal, Button, Input, Table, Spin } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const AssignStockCheckStaffModal = ({
  visible,
  onCancel,
  onAssign,
  selectedStaffId,
  setSelectedStaffId,
  staffs,
  loadingStaff,
  assignedStaff,
  stockCheckRequest,
  stockCheckLoading,
  searchText,
  onSearch,
  getRemainingAssignTime,
  calculateRemainingTime,
  getDefaultWorkingMinutes,
}) => {
  const getFilteredAndSortedStaffs = () => {
    const defaultWorkingMinutes = getDefaultWorkingMinutes();
    return staffs
      .map((staff) => ({
        ...staff,
        remainingTime: calculateRemainingTime(
          staff.totalExpectedWorkingTimeOfRequestInDay || "00:00:00",
          defaultWorkingMinutes
        ),
      }))
      .filter((staff) => {
        const searchLower = searchText.toLowerCase();
        return (
          staff.fullName.toLowerCase().includes(searchLower) ||
          staff.id.toString().includes(searchLower)
        );
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

  const handleSelectStaff = (staffId) => {
    setSelectedStaffId(staffId);
  };

  return (
    <Modal
      title={
        <div className="!bg-blue-50 -mx-6 -mt-4 px-6 py-4 border-b">
          <h3 className="text-xl font-semibold text-blue-900">
            Phân công nhân viên kiểm kê
          </h3>
          <p className="mt-1 text-lg text-blue-700">
            Phiếu kiểm kho #{stockCheckRequest?.id}
          </p>
          <p className="flex items-center mt-2 text-sm text-gray-700">
            <InfoCircleOutlined className="mr-2 text-blue-500" />
            Sau {getRemainingAssignTime() || "..."}, bạn sẽ không thể phân công
            lại nhân viên
          </p>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Đóng
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={onAssign}
          disabled={!selectedStaffId}
          loading={stockCheckLoading}
        >
          Phân công
        </Button>,
      ]}
      width={700}
      className="!top-[50px]"
    >
      {loadingStaff ? (
        <div className="flex items-center justify-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Assignment Info */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="mb-3 text-base font-medium text-gray-700">
              Nhân viên đang được phân công
            </h4>
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
              style={{
                height: "540px",
                overflowY: "auto",
              }}
              dataSource={getFilteredAndSortedStaffs()}
              rowKey="id"
              pagination={false}
              className="!cursor-pointer [&_.ant-table-row:hover>td]:!bg-transparent"
              onRow={(record) => ({
                onClick: () =>
                  record.id !== stockCheckRequest?.assignedWareHouseKeeperId &&
                  handleSelectStaff(record.id),
                className:
                  selectedStaffId === record.id
                    ? "!bg-blue-100"
                    : record.id === stockCheckRequest?.assignedWareHouseKeeperId
                    ? "!opacity-50 !cursor-not-allowed"
                    : "",
              })}
              columns={[
                {
                  title: "Mã nhân viên",
                  dataIndex: "id",
                  key: "id",
                  render: (id) => `#${id}`,
                  width: "45%",
                },
                {
                  title: "Họ tên",
                  dataIndex: "fullName",
                  key: "fullName",
                  width: "55%",
                },
                // {
                //   title: "Thời gian rảnh còn lại",
                //   dataIndex: "remainingTime",
                //   key: "remainingTime",
                //   width: "30%",
                //   render: (time, record) => (
                //     <span
                //       className={`font-medium ${
                //         record.id ===
                //         stockCheckRequest?.assignedWareHouseKeeperId
                //           ? "text-gray-400"
                //           : "text-blue-600"
                //       }`}
                //     >
                //       {time || "8 tiếng 0 phút"}
                //     </span>
                //   ),
                // },
              ]}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

AssignStockCheckStaffModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  selectedStaffId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSelectedStaffId: PropTypes.func.isRequired,
  staffs: PropTypes.arrayOf(PropTypes.object).isRequired,
  loadingStaff: PropTypes.bool.isRequired,
  assignedStaff: PropTypes.object,
  stockCheckRequest: PropTypes.object,
  stockCheckLoading: PropTypes.bool.isRequired,
  searchText: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
  getRemainingAssignTime: PropTypes.func.isRequired,
  calculateRemainingTime: PropTypes.func.isRequired,
  getDefaultWorkingMinutes: PropTypes.func.isRequired,
};

AssignStockCheckStaffModal.defaultProps = {
  selectedStaffId: null,
  assignedStaff: null,
  stockCheckRequest: null,
};

export default AssignStockCheckStaffModal;
