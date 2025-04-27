import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Card,
  Descriptions,
  Tag,
  Spin,
  message,
  Modal,
  Input
} from "antd";
import {
  ArrowLeftOutlined,
  UserAddOutlined,
  PrinterOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import useImportOrderService from "@/hooks/useImportOrderService";
import useImportOrderDetailService from "@/hooks/useImportOrderDetailService";
import useAccountService, { AccountRole } from "@/hooks/useAccountService";
import { ImportStatus, ImportOrderResponse } from "@/hooks/useImportOrderService";
import { ImportOrderDetailResponse } from "@/hooks/useImportOrderDetailService";
import { AccountResponse } from "@/hooks/useAccountService";
import { ROUTES } from "@/constants/routes";
import { useSelector } from "react-redux";
import { UserState } from "@/redux/features/userSlice";
import useConfigurationService, { ConfigurationDto } from "@/hooks/useConfigurationService";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);
import DetailInfoCard from "@/components/commons/DetailInfoCard";
import StatusTag from "@/components/commons/StatusTag";

const ImportOrderDetail = () => {
  const { importOrderId } = useParams<{ importOrderId: string }>();
  const navigate = useNavigate();

  // Modal states
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelModalText, setCancelModalText] = useState('Bạn có chắc chắn muốn hủy đơn nhập này không? Hành động này không thể hoàn tác.');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Data states
  const [importOrder, setImportOrder] = useState<ImportOrderResponse | null>(null);
  const [importOrderDetails, setImportOrderDetails] = useState<ImportOrderDetailResponse[]>([]);
  const [staffs, setStaffs] = useState<AccountResponse[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [assignedStaff, setAssignedStaff] = useState<AccountResponse | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [searchText, setSearchText] = useState('');

  const { getImportOrderById, assignStaff, cancelImportOrder } = useImportOrderService();
  const { getImportOrderDetailsPaginated } = useImportOrderDetailService();
  const { getActiveStaffsInDay, findAccountById } = useAccountService();

  const userRole = useSelector((state: { user: UserState }) => state.user.role);

  const { getConfiguration } = useConfigurationService();
  const [configuration, setConfiguration] = useState<ConfigurationDto | null>(null);

  // Fetch configuration
  const fetchConfiguration = useCallback(async () => {
    const config = await getConfiguration();
    setConfiguration(config);
  }, []);

  // Fetch import order data
  const fetchImportOrderData = useCallback(async () => {
    if (!importOrderId) return null;

    try {
      setLoading(true);
      const response = await getImportOrderById(parseInt(importOrderId));
      if (response?.content) {
        setImportOrder(response.content);
      }
      return response;
    } catch (error) {
      console.error("Failed to fetch import order:", error);
      message.error("Không thể tải thông tin đơn nhập");
      return null;
    } finally {
      setLoading(false);
    }
  }, [importOrderId, getImportOrderById]);

  const fetchImportOrderDetails = useCallback(async () => {
    if (!importOrderId) return;
    try {
      setDetailsLoading(true);
      const { current, pageSize } = pagination;
      const response = await getImportOrderDetailsPaginated(
        parseInt(importOrderId),
        current,
        pageSize
      );

      if (response?.content) {
        setImportOrderDetails(response.content);

        if (response.metaDataDTO) {
          const { page, limit, total } = response.metaDataDTO;
          setPagination(prev => ({
            ...prev,
            current: page,
            pageSize: limit,
            total: total,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch import order details:", error);
      message.error("Không thể tải danh sách chi tiết đơn nhập");
    } finally {
      setDetailsLoading(false);
    }
  }, [importOrderId, pagination, getImportOrderDetailsPaginated]);

  const fetchAssignedStaff = useCallback(async () => {
    if (!importOrderId) return;
    try {
      const response = await findAccountById(importOrder?.assignedStaffId);
      setAssignedStaff(response);
    } catch (error) {
      console.error("Failed to fetch assigned staff:", error);
      message.error("Không thể tải thông tin nhân viên đã phân công");
    }
  }, [importOrder, findAccountById]);

  const fetchActiveStaffs = async () => {
    if (!importOrder?.dateReceived) {
      message.error("Ngày nhận hàng không hợp lệ");
      return;
    }

    try {
      setLoadingStaff(true);
      const activeStaffs = await getActiveStaffsInDay(importOrder.dateReceived);
      setStaffs(activeStaffs);
    } catch (error) {
      console.error("Failed to fetch warehouse keepers:", error);
      message.error("Không thể tải danh sách nhân viên kho");
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchConfiguration();
  }, []);

  useEffect(() => {
    if (importOrderId) {
      fetchImportOrderData();
      fetchImportOrderDetails();
    }
  }, [importOrderId]);

  useEffect(() => {
    if (importOrder?.assignedStaffId) {
      fetchAssignedStaff();
    }
  }, [importOrder]);

  // Handle pagination changes
  useEffect(() => {
    if (pagination.current > 0) {
      fetchImportOrderDetails();
    }
  }, [pagination.current, pagination.pageSize]);

  // Helper function to calculate remaining time
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
    if (!configuration) return 480; // fallback
    const [startH, startM] = configuration.workingTimeStart.split(':').map(Number);
    const [endH, endM] = configuration.workingTimeEnd.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

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

  const handleSelectStaff = (staffId: number) => {
    setSelectedStaffId(staffId);
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId || !importOrderId) {
      message.warning("Vui lòng chọn nhân viên để phân công");
      return;
    }

    try {
      setAssigningStaff(true);
      await assignStaff({
        importOrderId: parseInt(importOrderId),
        accountId: selectedStaffId!
      });

      const importOrderResponse = await fetchImportOrderData();
      if (importOrderResponse?.content?.assignedStaffId) {
        await findAccountById(importOrderResponse.content.assignedStaffId);
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

  // Table pagination handler
  const handleTableChange = (pagination: any) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const handleBack = () => {
    navigate(ROUTES.PROTECTED.IMPORT.ORDER.LIST_FROM_REQUEST(importOrder?.importRequestId.toString()));
  };

  // Replace the existing handleCancelOrder with this new version
  const handleShowCancelModal = () => {
    setCancelModalVisible(true);
  };

  const handleCancelModalOk = async () => {
    if (!importOrderId) return;

    try {
      setCancelling(true);
      setCancelModalText('Đang xử lý huỷ đơn nhập...');

      await cancelImportOrder(parseInt(importOrderId));
      await fetchImportOrderData();

      message.success('Đã hủy đơn nhập thành công');
      setCancelModalVisible(false);
    } catch (error) {
      console.error("Failed to cancel import order:", error);
      message.error('Không thể hủy đơn nhập. Vui lòng thử lại');
    } finally {
      setCancelling(false);
      setCancelModalText('Bạn có chắc chắn muốn hủy đơn nhập này không? Hành động này không thể hoàn tác.');
    }
  };

  const handleCancelModalCancel = () => {
    setCancelModalVisible(false);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const getFilteredAndSortedStaffs = () => {
    const defaultWorkingMinutes = getDefaultWorkingMinutes();
    return staffs
      .map(staff => ({
        ...staff,
        remainingTime: calculateRemainingTime(staff.totalExpectedWorkingTimeOfRequestInDay || "00:00:00", defaultWorkingMinutes)
      }))
      .filter(staff => {
        const searchLower = searchText.toLowerCase();
        return (
          staff.fullName.toLowerCase().includes(searchLower) ||
          staff.id.toString().includes(searchLower)
        );
      })
      .sort((a, b) => {
        // Convert remaining time to minutes for comparison
        const getMinutes = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(' tiếng ').map(part => 
            parseInt(part.replace(' phút', ''))
          );
          return (hours * 60) + minutes;
        };
        
        return getMinutes(b.remainingTime) - getMinutes(a.remainingTime);
      });
  };

  // Add new function to check if reassignment is allowed
  const canReassignStaff = () => {
    if (!importOrder?.dateReceived || !importOrder?.timeReceived || !configuration?.timeToAllowAssign) {
      return true;
    }

    // Combine dateReceived and timeReceived into a Date object
    const receivedDateTime = new Date(`${importOrder.dateReceived}T${importOrder.timeReceived}`);
    const now = new Date();
    // Convert timeToAllowAssign to milliseconds
    const [hours, minutes, seconds] = configuration.timeToAllowAssign.split(':').map(Number);
    const allowAssignMs = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;

    // If receivedDateTime - now < timeToAllowAssign, don't allow reassignment
    return (receivedDateTime.getTime() - now.getTime()) >= allowAssignMs;
  };

  const getRemainingAssignTime = () => {
    if (!importOrder?.dateReceived || !importOrder?.timeReceived || !configuration?.timeToAllowAssign) {
      return null;
    }
    const receivedDateTime = new Date(`${importOrder.dateReceived}T${importOrder.timeReceived}`);
    const now = new Date();
    const [hours, minutes, seconds] = configuration.timeToAllowAssign.split(':').map(Number);
    const allowAssignMs = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
    const deadline = new Date(receivedDateTime.getTime() - allowAssignMs);
    const diffMs = deadline.getTime() - now.getTime();
    if (diffMs <= 0) return "0 tiếng 0 phút";
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffMins = diffMinutes % 60;
    return `${diffHours} tiếng ${diffMins} phút`;
  };

  // Table columns definition
  const columns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      width: '15%',
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "itemName",
      key: "itemName",
      ellipsis: true,
      width: '20%',
    },
    {
      title: "Số lượng nhập dự tính của đơn",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
      width: '25%',
    },
    {
      title: "Số lượng nhập thực tế của đơn",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      width: '25%',
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusTag status={status} type="detail" />, 
      width: '15%',
    }
  ];

  // Chuẩn bị dữ liệu cho DetailInfoCard
  const infoItems = [
    { label: "Mã đơn nhập", value: `#${importOrder?.importOrderId}` },
    { label: "Ghi chú", value: importOrder?.note || "-", span: 3 },
    { label: "Nhân viên được phân công", value: assignedStaff?.fullName || "-" },
    { label: "Ngày nhận hàng", value: importOrder?.dateReceived ? new Date(importOrder?.dateReceived).toLocaleDateString("vi-VN") : "-" },
    { label: "Giờ nhận hàng", value: importOrder?.timeReceived || "-" },
    { label: "Người tạo", value: importOrder?.createdBy || "-" },
    { label: "Ngày tạo", value: importOrder?.createdDate ? new Date(importOrder?.createdDate).toLocaleDateString("vi-VN") : "-" },
    { label: "Trạng thái", value: importOrder?.status && <StatusTag status={importOrder.status} type="import" />, span: 2 },
  ];

  // Show loading spinner when initially loading the page
  if (loading && !importOrder) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="mx-auto p-3 pt-0">
      <div className="flex items-center mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="mr-4"
        >
          Quay lại
        </Button>
      </div>
      <div className="flex items-center mb-4">
        <h1 className="text-xl font-bold mr-4">Chi tiết đơn nhập #{importOrder?.importOrderId}</h1>
        {importOrder?.status !== ImportStatus.CANCELLED && importOrder?.status !== ImportStatus.COMPLETED && (
          <>
            {userRole === AccountRole.WAREHOUSE_MANAGER && (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={handleOpenAssignModal}
                disabled={!canReassignStaff()}
                title={!canReassignStaff() ? "Đã quá thời gian cho phép phân công lại" : ""}
              >
                Phân công nhân viên
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              {userRole === AccountRole.DEPARTMENT && (
                <Button
                  danger
                  type="primary"
                  onClick={handleShowCancelModal}
                  loading={cancelling}
                >
                  Hủy đơn nhập
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <DetailInfoCard title="Thông tin đơn nhập" items={infoItems} />

      <div className="flex justify-between items-center mt-16 mb-4">
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={() => {/* Logic sẽ được thêm sau */}}
        >
          In QRCode
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={importOrderDetails}
        rowKey="importOrderDetailId"
        loading={detailsLoading}
        onChange={handleTableChange}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['10', '50'],
          showTotal: (total) => `Tổng cộng ${total} sản phẩm trong đơn nhập`,
        }}
      />

      {/* Staff Assignment Modal */}
      <Modal
        title={
          <div className="!bg-blue-50 -mx-6 -mt-4 px-6 py-4 border-b">
            <h3 className="text-xl font-semibold text-blue-900">Phân công nhân viên kho</h3>
            <p className="text-lg text-blue-700 mt-1">Đơn nhập #{importOrder?.importOrderId}</p>
            <p className="text-sm text-gray-700 mt-2 flex items-center">
              <InfoCircleOutlined className="mr-2 text-blue-500" />
              Sau {getRemainingAssignTime() || "..."},
              bạn sẽ không thể phân công lại nhân viên
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
            onClick={handleAssignStaff}
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
              <h4 className="text-base font-medium text-gray-700 mb-3">Nhân viên đang được phân công</h4>
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
                <h4 className="text-base font-medium text-gray-700">Danh sách nhân viên có thể phân công</h4>
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
                  onClick: () => record.id !== importOrder?.assignedStaffId && handleSelectStaff(record.id),
                  className: selectedStaffId === record.id 
                    ? '!bg-blue-100' 
                    : record.id === importOrder?.assignedStaffId 
                      ? '!opacity-50 !cursor-not-allowed' 
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
                  {
                    title: "Thời gian rảnh còn lại",
                    dataIndex: "remainingTime",
                    key: "remainingTime",
                    width: '30%',
                    render: (time, record) => (
                      <span className={`font-medium ${record.id === importOrder?.assignedStaffId ? 'text-gray-400' : 'text-blue-600'}`}>
                        {time || "8 tiếng 0 phút"}
                      </span>
                    )
                  }
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Xác nhận hủy đơn nhập"
        open={cancelModalVisible}
        onOk={handleCancelModalOk}
        confirmLoading={cancelling}
        onCancel={handleCancelModalCancel}
        okText="Xác nhận"
        cancelText="Quay lại"
        okButtonProps={{ danger: true }}
      >
        <p>{cancelModalText}</p>
      </Modal>
    </div>
  );
};

export default ImportOrderDetail; 