import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Card,
  Descriptions,
  Spin,
  message,
  Tag,
  Modal,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import useExportRequestService, {
  ExportStatus,
} from "../../../../hooks/useExportRequestService";
import useExportRequestDetailService from "../../../../hooks/useExportRequestDetailService";
import useItemService from "../../../../hooks/useItemService";
import { useSelector } from "react-redux";
import useConfigurationService from "@/hooks/useConfigurationService";
import useAccountService from "@/hooks/useAccountService";
import { AccountRole } from "@/constants/account-roles";

const ExportRequestDetail = () => {
  const { exportRequestId } = useParams();
  const [configuration, setConfiguration] = useState(null);
  const navigate = useNavigate();
  const { getExportRequestById, assignCountingStaff } =
    useExportRequestService();
  const { getExportRequestDetails } = useExportRequestDetailService();
  const { getItemById } = useItemService();
  const [exportRequest, setExportRequest] = useState(null);
  const [exportRequestDetails, setExportRequestDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const { getConfiguration } = useConfigurationService();
  const [loadingStaff, setLoadingStaff] = useState(false);
  const { getActiveStaffsInDay, findAccountById } = useAccountService();
  const [staffs, setStaffs] = useState([]);
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [assignedStaff, setAssignedStaff] = useState(null);
  const [searchText, setSearchText] = useState("");
  const userRole = useSelector((state) => state.user.role);

  // Hàm lấy thông tin phiếu xuất
  const fetchExportRequestData = useCallback(async () => {
    if (!exportRequestId) return;
    try {
      setLoading(true);
      const data = await getExportRequestById(parseInt(exportRequestId));
      setExportRequest(data);
    } catch (error) {
      console.error("Failed to fetch export request:", error);
      message.error("Không thể tải thông tin phiếu xuất");
    } finally {
      setLoading(false);
    }
  }, [exportRequestId, getExportRequestById]);

  const getStatusTag = (status) => {
    switch (status) {
      case "NOT_STARTED":
        return <Tag color="default">Chưa bắt đầu</Tag>;
      case "IN_PROGRESS":
        return <Tag color="processing">Đã kiểm kho</Tag>;
      case "COMPLETED":
        return <Tag color="success">Hoàn tất</Tag>;
      case "CANCELLED":
        return <Tag color="error">Đã hủy</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  // Hàm "enrich" danh sách chi tiết sản phẩm bằng cách lấy itemName từ API
  const enrichDetails = async (details) => {
    const enriched = await Promise.all(
      details.map(async (detail) => {
        try {
          const res = await getItemById(detail.itemId);
          const itemName =
            res && res.content ? res.content.name : "Không xác định";
          return { ...detail, itemName };
        } catch (error) {
          console.error(`Error fetching item with id ${detail.itemId}:`, error);
          return { ...detail, itemName: "Không xác định" };
        }
      })
    );
    return enriched;
  };

  const fetchDetails = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    if (!exportRequestId) return;
    try {
      setDetailsLoading(true);
      const response = await getExportRequestDetails(
        parseInt(exportRequestId),
        page,
        pageSize
      );
      if (response && response.content) {
        const enriched = await enrichDetails(response.content);
        setExportRequestDetails(enriched);
        const meta = response.metaDataDTO;
        setPagination({
          current: meta ? meta.page : page,
          pageSize: meta ? meta.limit : pageSize,
          total: meta ? meta.total : 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch export request details:", error);
      message.error("Không thể tải danh sách chi tiết phiếu xuất");
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchActiveStaffs = async () => {
    if (!exportRequest?.exportDate) {
      message.error("Ngày nhận hàng không hợp lệ");
      return;
    }

    try {
      setLoadingStaff(true);
      const activeStaffs = await getActiveStaffsInDay({
        date: exportRequest.exportDate,
        exportRequestId: exportRequest.exportRequestId,
      });
      setStaffs(activeStaffs);
    } catch (error) {
      console.error("Failed to fetch warehouse keepers:", error);
      message.error("Không thể tải danh sách nhân viên kho");
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchAssignedStaff = useCallback(async () => {
    if (!exportRequestId) return;
    try {
      const response = await findAccountById(exportRequest?.countingStaffId);
      setAssignedStaff(response);
    } catch (error) {
      console.error("Failed to fetch assigned staff:", error);
      message.error("Không thể tải thông tin nhân viên đã phân công");
    }
  }, [exportRequestId, findAccountById]);

  useEffect(() => {
    fetchExportRequestData();
  }, []);

  useEffect(() => {
    fetchDetails();
  }, []);

  useEffect(() => {
    if (exportRequest?.countingStaffId) {
      fetchAssignedStaff();
    }
  }, [exportRequest]);

  const handleOpenAssignModal = async () => {
    setSelectedStaffId(null);
    // Lấy configuration
    try {
      const config = await getConfiguration();
      setConfiguration(config);
    } catch (e) {
      // Có thể toast lỗi ở đây nếu muốn
    }
    fetchActiveStaffs();
    setAssignModalVisible(true);
  };

  const handleCloseAssignModal = () => {
    setAssignModalVisible(false);
    setSelectedStaffId(null);
  };

  const handleSelectStaff = (staffId) => {
    setSelectedStaffId(staffId);
  };

  const handleAssignCountingStaff = async () => {
    if (!selectedStaffId || !exportRequestId) {
      message.warning("Vui lòng chọn nhân viên để phân công");
      return;
    }

    try {
      setAssigningStaff(true);
      await assignCountingStaff(exportRequestId, selectedStaffId);

      const exportRequestResponse = await fetchExportRequestData();
      if (exportRequestResponse?.content?.assignedWareHouseKeeperId) {
        await findAccountById(
          exportRequestResponse.content.assignedWareHouseKeeperId
        );
      }
      await fetchActiveStaffs();

      message.success("Phân công nhân viên thành công");
      setSelectedStaffId(null);
    } catch (error) {
      console.error("Failed to assign warehouse keeper:", error);
      message.error("Không thể phân công nhân viên. Vui lòng thử lại");
    } finally {
      setAssigningStaff(false);
    }
  };

  const getExportTypeText = (type) => {
    if (type === "PRODUCTION") return "Xuất sản xuất";
    return "";
  };

  // Add new function to check if reassignment is allowed
  const canReassignCountingStaff = () => {
    if (
      !exportRequest?.exportDate ||
      !exportRequest?.exportTime ||
      !configuration?.timeToAllowAssign
    ) {
      return true;
    }

    // Combine dateReceived and timeReceived into a Date object
    const receivedDateTime = new Date(
      `${exportRequest.exportDate}T${exportRequest.exportTime}`
    );
    const now = new Date();
    // Convert timeToAllowAssign to milliseconds
    const [hours, minutes, seconds] = configuration.timeToAllowAssign
      .split(":")
      .map(Number);
    const allowAssignMs = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;

    // If current time - received time < timeToAllowAssign, don't allow reassignment
    return Date.now() - receivedDateTime.getTime() <= allowAssignMs;
  };

  const getRemainingAssignTime = () => {
    if (
      !exportRequest?.exportDate ||
      !exportRequest?.exportTime ||
      !configuration?.timeToAllowAssign
    ) {
      return null;
    }

    // 1. Thời điểm nhận hàng
    const receivedDateTime = new Date(
      `${exportRequest.exportDate}T${exportRequest.exportTime}`
    );

    // 2. Hạn chót = nhận hàng + timeToAllowAssign
    const [h, m, s] = configuration.timeToAllowAssign.split(":").map(Number);
    const allowAssignMs = (h * 3600 + m * 60 + s) * 1000;
    const deadline = new Date(receivedDateTime.getTime() - allowAssignMs); //  **+**  ở đây

    // 3. Còn lại bao lâu
    const diffMs = deadline.getTime() - Date.now();
    if (diffMs <= 0) return "0 tiếng 0 phút"; // đã quá hạn

    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffMins = diffMinutes % 60;
    return `${diffHours} tiếng ${diffMins} phút`;
  };

  const calculateRemainingTime = (totalExpectedTime, defaultWorkingMinutes) => {
    try {
      const [hours, minutes] = totalExpectedTime.split(":").map(Number);
      const expectedMinutes = hours * 60 + minutes;
      const remainingMinutes = defaultWorkingMinutes - expectedMinutes;
      if (remainingMinutes <= 0) return "0 tiếng 0 phút";
      const remainingHours = Math.floor(remainingMinutes / 60);
      const remainingMins = Math.floor(remainingMinutes % 60);
      return `${remainingHours} tiếng ${remainingMins} phút`;
    } catch (error) {
      return `${Math.floor(defaultWorkingMinutes / 60)} tiếng ${
        defaultWorkingMinutes % 60
      } phút`;
    }
  };

  const getDefaultWorkingMinutes = () => {
    if (!configuration) return 480; // fallback
    const [startH, startM] = configuration.workingTimeStart
      .split(":")
      .map(Number);
    const [endH, endM] = configuration.workingTimeEnd.split(":").map(Number);
    return endH * 60 + endM - (startH * 60 + startM);
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

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

  const renderDescriptionItems = () => {
    if (!exportRequest) return null;
    const items = [
      <Descriptions.Item label="Mã phiếu xuất" key="exportId">
        #{exportRequest.exportRequestId}
      </Descriptions.Item>,
      <Descriptions.Item label="Trạng thái phiếu" key="status">
        {getStatusTag(exportRequest.status)}
      </Descriptions.Item>,
      <Descriptions.Item label="Ngày xuất" key="exportDate">
        {exportRequest.exportDate
          ? new Date(exportRequest.exportDate).toLocaleDateString("vi-VN")
          : "-"}
      </Descriptions.Item>,
      <Descriptions.Item label="Người lập phiếu" key="createdBy">
        {exportRequest.createdBy || "-"}
      </Descriptions.Item>,
    ];

    if (exportRequest.type === "PRODUCTION") {
      items.push(
        <Descriptions.Item label="Loại phiếu xuất" key="exportType">
          {getExportTypeText(exportRequest.type)}
        </Descriptions.Item>,
        // <Descriptions.Item label="Phòng ban" key="receivingDepartment">
        //   {exportRequest.departmentId || "-"}
        // </Descriptions.Item>,
        <Descriptions.Item label="Lý do xuất" key="exportReason">
          {exportRequest.exportReason || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Người nhận hàng" key="receiverName">
          {exportRequest.receiverName || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Số điện thoại nhận hàng" key="receiverPhone">
          {exportRequest.receiverPhone || "-"}
        </Descriptions.Item>
      );
    } else if (exportRequest.type === "BORROWING") {
      if (exportRequest.receiverAddress) {
        items.push(
          <Descriptions.Item label="Loại phiếu xuất" key="exportType">
            Xuất mượn (bên ngoài)
          </Descriptions.Item>,
          <Descriptions.Item label="Tên công ty/Người mượn" key="receiverName">
            {exportRequest.receiverName || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Số điện thoại" key="receiverPhone">
            {exportRequest.receiverPhone || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Địa chỉ" key="receiverAddress">
            {exportRequest.receiverAddress || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Lý do mượn" key="exportReason">
            {exportRequest.exportReason || "-"}
          </Descriptions.Item>
        );
      } else {
        items.push(
          <Descriptions.Item label="Loại phiếu xuất" key="exportType">
            Xuất mượn (nội bộ)
          </Descriptions.Item>,
          <Descriptions.Item label="Người nhận hàng" key="receiverName">
            {exportRequest.receiverName || "-"}
          </Descriptions.Item>,
          <Descriptions.Item
            label="Số điện thoại nhận hàng"
            key="receiverPhone"
          >
            {exportRequest.receiverPhone || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Lý do mượn" key="exportReason">
            {exportRequest.exportReason || "-"}
          </Descriptions.Item>
        );
      }
      if (exportRequest.expectedReturnDate) {
        items.push(
          <Descriptions.Item label="Ngày trả dự kiến" key="expectedReturnDate">
            {new Date(exportRequest.expectedReturnDate).toLocaleDateString(
              "vi-VN"
            )}
          </Descriptions.Item>
        );
      }
    }

    // Hiển thị thông tin nhân viên kho (nếu có)
    // items.push(
    //   <Descriptions.Item label="Người kiểm kho" key="warehouseKeeper">
    //     {assignedStaff?.fullName || "-"}
    //   </Descriptions.Item>
    // );

    // items.push(
    //   <Descriptions.Item label="Ghi chú" key="note" span={3}>
    //     {exportRequest.note || "-"}
    //   </Descriptions.Item>
    // );
    return items;
  };

  const columns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      render: (id) => `#${id}`,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "itemName",
      key: "itemName",
      ellipsis: true,
    },
    {
      title: "Số lượng cần",
      dataIndex: "quantity",
      key: "quantity",
      render: (text) => <div className="pl-19">{text}</div>,
    },
    {
      title: "Số lượng đã đóng gói",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      render: (text) => <div className="pl-32">{text}</div>,
    },
    {
      title: "Quy cách",
      dataIndex: "measurementValue",
      key: "measurementValue",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => status || "-",
    },
  ];

  const handleTableChange = (pag) => {
    setPagination({
      ...pagination,
      current: pag.current,
      pageSize: pag.pageSize,
    });
    fetchDetails(pag.current, pag.pageSize);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && !exportRequest) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="mx-auto p-5">
      <div className="flex items-center mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="mr-4"
        >
          Quay lại
        </Button>
        <h1 className="text-xl font-bold m-0 mr-10">
          Chi tiết phiếu xuất #{exportRequest?.exportRequestId}
        </h1>
        {exportRequest?.status !== ExportStatus.CANCELLED &&
          exportRequest?.status !== ExportStatus.COMPLETED && (
            <>
              {userRole === AccountRole.WAREHOUSE_MANAGER && (
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={handleOpenAssignModal}
                  disabled={!canReassignCountingStaff()}
                  title={
                    !canReassignCountingStaff()
                      ? "Đã quá thời gian cho phép phân công lại"
                      : ""
                  }
                >
                  Phân công nhân viên
                </Button>
              )}
            </>
          )}
      </div>

      <Card className="mb-6">
        <Descriptions title="Thông tin phiếu xuất" bordered>
          {renderDescriptionItems()}
        </Descriptions>
      </Card>

      <h2 className="text-lg font-semibold mb-4 mt-[20px]">
        Danh sách chi tiết sản phẩm xuất
      </h2>
      <Table
        columns={columns}
        dataSource={exportRequestDetails}
        rowKey="id"
        loading={detailsLoading}
        onChange={handleTableChange}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "50"],
          showTotal: (total) => `Tổng cộng ${total} sản phẩm`,
        }}
      />

      {/* Modal chọn Warehouse Keeper */}
      <Modal
        title={
          <div className="!bg-blue-50 -mx-6 -mt-4 px-6 py-4 border-b">
            <h3 className="text-xl font-semibold text-blue-900">
              Phân công nhân viên kho
            </h3>
            <p className="text-lg text-blue-700 mt-1">
              Phiếu xuất #{exportRequest?.exportRequestId}
            </p>
            <p className="text-sm text-gray-700 mt-2 flex items-center">
              <InfoCircleOutlined className="mr-2 text-blue-500" />
              Sau {getRemainingAssignTime() || "..."}, bạn sẽ không thể phân
              công lại nhân viên
            </p>
          </div>
        }
        open={assignModalVisible}
        onCancel={handleCloseAssignModal}
        footer={[
          <Button key="cancel" onClick={handleCloseAssignModal}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAssignCountingStaff}
            disabled={!selectedStaffId}
            loading={assigningStaff}
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
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-medium text-gray-700">
                  Danh sách nhân viên có thể phân công
                </h4>
                <Input.Search
                  placeholder="Tìm theo tên hoặc mã nhân viên"
                  allowClear
                  onSearch={handleSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 300 }}
                />
              </div>
              <Table
                dataSource={getFilteredAndSortedStaffs()}
                rowKey="id"
                pagination={false}
                className="!cursor-pointer [&_.ant-table-row:hover>td]:!bg-transparent"
                onRow={(record) => ({
                  onClick: () =>
                    record.id !== exportRequest?.assignedWareHouseKeeperId &&
                    handleSelectStaff(record.id),
                  className:
                    selectedStaffId === record.id
                      ? "!bg-blue-100"
                      : record.id === exportRequest?.assignedWareHouseKeeperId
                      ? "!opacity-50 !cursor-not-allowed"
                      : "",
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
                    render: (time, record) => (
                      <span
                        className={`font-medium ${
                          record.id === exportRequest?.assignedWareHouseKeeperId
                            ? "text-gray-400"
                            : "text-blue-600"
                        }`}
                      >
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
    </div>
  );
};

export default ExportRequestDetail;
