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
  Space,
  QRCode
} from "antd";
import {
  ArrowLeftOutlined,
  UserAddOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import useImportOrderService from "@/hooks/useImportOrderService";
import useImportOrderDetailService from "@/hooks/useImportOrderDetailService";
import useInventoryItemService from "@/hooks/useInventoryItemService";
import useAccountService, { AccountRole, AccountRoleForRequest } from "@/hooks/useAccountService";
import { ImportStatus, ImportOrderResponse } from "@/hooks/useImportOrderService";
import { ImportOrderDetailResponse } from "@/hooks/useImportOrderDetailService";
import { InventoryItemResponse, QrCodeResponse } from "@/hooks/useInventoryItemService";
import { AccountResponse } from "@/hooks/useAccountService";
import { ROUTES } from "@/constants/routes";

const ImportOrderDetail = () => {
  const { importOrderId } = useParams<{ importOrderId: string }>();
  const navigate = useNavigate();

  // Modal states
  const [qrViewModalVisible, setQrViewModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelModalText, setCancelModalText] = useState('Bạn có chắc chắn muốn hủy đơn nhập này không? Hành động này không thể hoàn tác.');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [qrCodesLoading, setQrCodesLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Data states
  const [importOrder, setImportOrder] = useState<ImportOrderResponse | null>(null);
  const [importOrderDetails, setImportOrderDetails] = useState<ImportOrderDetailResponse[]>([]);
  const [qrCodes, setQrCodes] = useState<QrCodeResponse[]>([]);
  const [staffs, setStaffs] = useState<AccountResponse[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [assignedStaff, setAssignedStaff] = useState<AccountResponse | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const { getImportOrderById, assignStaff, cancelImportOrder } = useImportOrderService();
  const { getImportOrderDetailsPaginated } = useImportOrderDetailService();
  const { getByImportOrderDetailId, getListQrCodes } = useInventoryItemService();
  const { getActiveStaff, findAccountById } = useAccountService();

  // Fetch import order data
  const fetchImportOrderData = useCallback(async () => {
    if (!importOrderId) return;

    try {
      setLoading(true);
      const response = await getImportOrderById(parseInt(importOrderId));
      if (response?.content) {
        setImportOrder(response.content);
      }
    } catch (error) {
      console.error("Failed to fetch import order:", error);
      message.error("Không thể tải thông tin đơn nhập");
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

        if (response.metadata) {
          const { page, limit, totalElements } = response.metadata;
          setPagination(prev => ({
            ...prev,
            current: page,
            pageSize: limit,
            total: totalElements,
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
    try {
      setLoadingStaff(true);
      const activeStaffs = await getActiveStaff();
      setStaffs(activeStaffs);
    } catch (error) {
      console.error("Failed to fetch warehouse keepers:", error);
      message.error("Không thể tải danh sách nhân viên kho");
    } finally {
      setLoadingStaff(false);
    }
  };

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


  const handleOpenAssignModal = () => {
    setSelectedStaffId(null);
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
        accountId: selectedStaffId
      });

      await fetchImportOrderData();
      await fetchAssignedStaff();
      await fetchActiveStaffs();
    } catch (error) {
      console.error("Failed to assign warehouse keeper:", error);
    } finally {
      setAssigningStaff(false);
    }
  };

  // Status tag renderers
  const getStatusTag = (status: ImportStatus) => {
    const statusMap = {
      [ImportStatus.NOT_STARTED]: { color: "default", text: "Chưa bắt đầu" },
      [ImportStatus.IN_PROGRESS]: { color: "processing", text: "Đang xử lý" },
      [ImportStatus.COMPLETED]: { color: "success", text: "Hoàn tất" },
      [ImportStatus.CANCELLED]: { color: "error", text: "Đã hủy" }
    };

    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getDetailStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      "LACK": { color: "error", text: "THIẾU" },
      "EXCESS": { color: "error", text: "THỪA" },
      "MATCH": { color: "success", text: "ĐỦ" }
    };

    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
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

  // Function to fetch and show QR codes
  const handleViewQrCodes = async (record: ImportOrderDetailResponse) => {
    try {
      setQrCodesLoading(true);

      // First, get inventory items associated with this import order detail
      const inventoryItems = await getByImportOrderDetailId(record.importOrderDetailId);

      if (inventoryItems?.items && inventoryItems.items.length > 0) {
        // Extract IDs for QR code lookup
        const inventoryItemIds = inventoryItems.items.map(item => item.id);

        // Fetch QR codes
        const qrCodeData = await getListQrCodes(inventoryItemIds);

        if (qrCodeData && qrCodeData.length > 0) {
          setQrCodes(qrCodeData);
          setQrViewModalVisible(true);
        } else {
          message.info("Không tìm thấy mã QR cho sản phẩm này");
        }
      } else {
        message.info("Không tìm thấy sản phẩm trong kho cho chi tiết đơn nhập này");
      }
    } catch (error) {
      console.error("Failed to fetch QR codes:", error);
      message.error("Không thể tải mã QR");
    } finally {
      setQrCodesLoading(false);
    }
  };

  // Function to close QR view modal
  const handleCloseQrViewModal = () => {
    setQrViewModalVisible(false);
    setQrCodes([]);
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

  // Table columns definition
  const columns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      width: '10%',
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
      width: '20%',
    },
    {
      title: "Số lượng nhập thực tế của đơn",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      width: '20%',
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: getDetailStatusTag,
      width: '12%',
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: ImportOrderDetailResponse) => (
        <Space>
          <Button
            onClick={() => handleViewQrCodes(record)}
          >
            Xem QR-Code
          </Button>
        </Space>
      ),
      width: '12%',
    },
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
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleOpenAssignModal}
            >
              Phân công nhân viên
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                danger
                type="primary"
                onClick={handleShowCancelModal}
                loading={cancelling}
              >
                Hủy đơn nhập
              </Button>
            </div>
          </>
        )}
      </div>

      <Card className="mb-6">
        <Descriptions title="Thông tin đơn nhập" bordered>
          <Descriptions.Item label="Mã đơn nhập">#{importOrder?.importOrderId}</Descriptions.Item>
          <Descriptions.Item label="Ghi chú" span={3}>
            {importOrder?.note || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Nhân viên được phân công">
            {assignedStaff?.fullName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày nhận hàng">
            {importOrder?.dateReceived ? new Date(importOrder?.dateReceived).toLocaleDateString("vi-VN") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Giờ nhận hàng">
            {importOrder?.timeReceived || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Người tạo">{importOrder?.createdBy || "-"}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {importOrder?.createdDate ? new Date(importOrder?.createdDate).toLocaleDateString("vi-VN") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={2}>
            {importOrder?.status && (
              <Tag
                color={getStatusTag(importOrder.status).props.color}
                style={{
                  fontSize: '14px',
                  height: 'auto'
                }}
              >
                {getStatusTag(importOrder.status).props.children}
              </Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <div className="flex justify-between items-center mt-16 mb-4">
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
        title="Phân công nhân viên kho"
        open={assignModalVisible}
        onCancel={handleCloseAssignModal}
        footer={[
          <Descriptions title="Nhân viên đang được phân công" bordered>
            <Descriptions.Item label="Họ tên">{assignedStaff?.fullName || "-"}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{assignedStaff?.phone || "-"}</Descriptions.Item>
          </Descriptions>,
          <Button key="cancel" onClick={handleCloseAssignModal}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAssignStaff}
            loading={assigningStaff}
            disabled={!selectedStaffId}
          >
            Xác nhận phân công
          </Button>,
        ]}
        width={700}
      >
        {loadingStaff ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <div>
            <p className="mb-4">Chọn nhân viên kho để phân công cho đơn nhập #{importOrder?.importOrderId}</p>
            <Table
              dataSource={staffs}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: "Họ tên",
                  dataIndex: "fullName",
                  key: "fullName",
                },
                {
                  title: "Số điện thoại",
                  dataIndex: "phone",
                  key: "phone",
                },
                {
                  title: "Trạng thái",
                  dataIndex: "status",
                  key: "status",
                  render: (status: string) => {
                    const statusMap: Record<string, { color: string; text: string }> = {
                      "ACTIVE": { color: "green", text: "Hoạt động" },
                      "INACTIVE": { color: "red", text: "Không hoạt động" },
                    };
                    const statusInfo = statusMap[status] || { color: "default", text: status };
                    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
                  }
                },
                {
                  title: "Thao tác",
                  key: "action",
                  render: (_: any, record: AccountResponse) => (
                    <Button
                      type={selectedStaffId === record.id ? "primary" : "default"}
                      size="small"
                      onClick={() => handleSelectStaff(record.id)}
                    >
                      {selectedStaffId === record.id ? "Đã chọn" : "Chọn"}
                    </Button>
                  )
                }
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="Xem mã QR"
        open={qrViewModalVisible}
        onCancel={handleCloseQrViewModal}
        footer={[
          <Button key="close" onClick={handleCloseQrViewModal}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {qrCodesLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <div>
            <p className="mb-4">Tổng cộng: {qrCodes.length} mã QR</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {qrCodes.map((qrCode, index) => (
                <div key={index} className="border p-4 rounded-md flex flex-col items-center">
                  <QRCode
                    value={JSON.stringify(qrCode)}
                    size={150}
                    bordered={false}
                  />
                  <div className="mt-2 text-xs text-center">
                    <p>Mã sản phẩm trong kho: #{qrCode.id}</p>
                    <p>Số lượng trong kho: {qrCode.quantity || 0}</p>
                  </div>
                </div>
              ))}
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