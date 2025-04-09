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
  InputNumber,
  QRCode,
  Space
} from "antd";
import {
  ArrowLeftOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import useImportOrderService from "../../../../hooks/useImportOrderService";
import useImportOrderDetailService from "../../../../hooks/useImportOrderDetailService";
import useInventoryItemService from "../../../../hooks/useInventoryItemService";
import useAccountService, { AccountRole } from "../../../../hooks/useAccountService";

const ImportOrderDetail = () => {
  const { importOrderId } = useParams();
  const navigate = useNavigate();
  const [importOrder, setImportOrder] = useState(null);
  const [importOrderDetails, setImportOrderDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [numberOfQrCodes, setNumberOfQrCodes] = useState(1);
  const [qrGenerating, setQrGenerating] = useState(false);
  const [qrViewModalVisible, setQrViewModalVisible] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [qrCodesLoading, setQrCodesLoading] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [warehouseKeepers, setWarehouseKeepers] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [assigningStaff, setAssigningStaff] = useState(false);

  const { getImportOrderById, assignWarehouseKeeper } = useImportOrderService();
  const {
    getImportOrderDetailsPaginated
  } = useImportOrderDetailService();
  const { 
    createInventoryItemWithQrCode,
    getListQrCodes,
    getByImportOrderDetailId
  } = useInventoryItemService();
  const { getAccountsByRole } = useAccountService();

  // Fetch import order data
  const fetchImportOrderData = useCallback(async () => {
    if (!importOrderId) return;

    try {
      setLoading(true);
      const data = await getImportOrderById(parseInt(importOrderId));
      setImportOrder(data);
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

      if (response) {
        setImportOrderDetails(response);

        // Only update pagination if metadata exists and if any values differ
        if (response.metaDataDTO) {
          const { page, limit, total } = response.metaDataDTO;
          if (page !== pagination.current ||
            limit !== pagination.pageSize ||
            total !== pagination.total) {
            setPagination(prev => ({
              ...prev,
              current: page,
              pageSize: limit,
              total: total,
            }));
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch import order details:", error);
      message.error("Không thể tải danh sách chi tiết đơn nhập");
    } finally {
      setDetailsLoading(false);
    }
  }, [importOrderId, pagination, getImportOrderDetailsPaginated]);

  const fetchWarehouseKeepers = async () => {
    try {
      setLoadingStaff(true);
      const staff = await getAccountsByRole(AccountRole.WAREHOUSE_KEEPER);
      setWarehouseKeepers(staff);
    } catch (error) {
      console.error("Failed to fetch warehouse keepers:", error);
      message.error("Không thể tải danh sách nhân viên kho");
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleOpenAssignModal = () => {
    setSelectedStaffId(null);
    fetchWarehouseKeepers();
    setAssignModalVisible(true);
  };

  const handleCloseAssignModal = () => {
    setAssignModalVisible(false);
    setSelectedStaffId(null);
  };

  const handleSelectStaff = (staffId) => {
    setSelectedStaffId(staffId);
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId) {
      message.warning("Vui lòng chọn nhân viên để phân công");
      return;
    }

    try {
      setAssigningStaff(true);
      await assignWarehouseKeeper(
        parseInt(importOrderId),
        selectedStaffId
      );
      
      // Refresh import order data to show the assigned staff
      await fetchImportOrderData();
      
      handleCloseAssignModal();
    } catch (error) {
      console.error("Failed to assign warehouse keeper:", error);
    } finally {
      setAssigningStaff(false);
    }
  };

  useEffect(() => {
    fetchImportOrderData();
  }, [importOrderId]);

  useEffect(() => {
    fetchImportOrderDetails();
  }, [importOrderId]); // Only depend on importOrderId for initial fetch

  // Handle pagination changes
  useEffect(() => {
    if (pagination.current > 0) {
      fetchImportOrderDetails();
    }
  }, [pagination.current, pagination.pageSize]); // Only re-fetch when these specific values change

  // Status tag renderers
  const getStatusTag = (status) => {
    const statusMap = {
      "NOT_STARTED": { color: "default", text: "Chưa bắt đầu" },
      "IN_PROGRESS": { color: "processing", text: "Đang xử lý" },
      "COMPLETED": { color: "success", text: "Hoàn tất" },
      "CANCELLED": { color: "error", text: "Đã hủy" }
    };

    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getDetailStatusTag = (status) => {
    const statusMap = {
      "NOT_STARTED": { color: "default", text: "Chưa bắt đầu" },
      "IN_PROGRESS": { color: "processing", text: "Đang xử lý" },
      "COMPLETED": { color: "success", text: "Hoàn tất" },
      "CANCELLED": { color: "error", text: "Đã hủy" }
    };

    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // Table pagination handler
  const handleTableChange = (pagination) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleOpenQrModal = (record) => {
    setSelectedRecord(record);
    setQrModalVisible(true);
  };

  const handleCloseQrModal = () => {
    setQrModalVisible(false);
    setSelectedRecord(null);
    setNumberOfQrCodes(1);
  };

  const handleGenerateQrCodes = async () => {
    if (!selectedRecord || !numberOfQrCodes || numberOfQrCodes < 1) {
      message.error("Vui lòng nhập số lượng QR code cần tạo");
      return;
    }

    try {
      setQrGenerating(true);
      
      const request = {
        itemId: selectedRecord.itemId,
        importOrderDetailId: selectedRecord.importOrderDetailId,
        numberOfQrCodes: numberOfQrCodes
      };
      
      const response = await createInventoryItemWithQrCode(request);
      
      if (response) {
        message.success(`Đã tạo thành công ${numberOfQrCodes} mã QR cho sản phẩm ${selectedRecord.itemName}`);
        handleCloseQrModal();
        
        // Refresh import order details to reflect the changes
        fetchImportOrderDetails();
      }
    } catch (error) {
      console.error("Failed to generate QR codes:", error);
    } finally {
      setQrGenerating(false);
    }
  };

  // Function to fetch and show QR codes
  const handleViewQrCodes = async (record) => {
    try {
      setQrCodesLoading(true);
      
      // First, get inventory items associated with this import order detail
      const inventoryItems = await getByImportOrderDetailId(record.importOrderDetailId);
      
      if (inventoryItems && inventoryItems.length > 0) {
        // Extract IDs for QR code lookup
        const inventoryItemIds = inventoryItems.map(item => item.id);
        
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
      title: "Số lượng nhập dự tính của đơn này",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
      width: '15%',
    },
    {
      title: "Số lượng nhập thực tế của đơn ngày",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      width: '15%',
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: getDetailStatusTag,
      width: '15%',
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => handleOpenQrModal(record)}
            disabled={record.status === "CANCELLED"}
          >
            Tạo QR-Code
          </Button>
          <Button
            onClick={() => handleViewQrCodes(record)}
            disabled={record.status === "CANCELLED"}
          >
            Xem QR-Code
          </Button>
        </Space>
      ),
      width: '20%',
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
    <div className="mx-auto p-4">
      <div className="flex items-center mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="mr-4"
        >
          Quay lại
        </Button>
        <h1 className="text-xl font-bold m-0">Chi tiết đơn nhập #{importOrder?.importOrderId}</h1>
        <Button 
          type="primary" 
          icon={<UserAddOutlined />} 
          onClick={handleOpenAssignModal}
          className="ml-auto"
        >
          Phân công nhân viên
        </Button>
      </div>

      <Card className="mb-6">
        <Descriptions title="Thông tin đơn nhập" bordered>
          <Descriptions.Item label="Mã đơn nhập">#{importOrder?.importOrderId}</Descriptions.Item>
          <Descriptions.Item label="Mã phiếu nhập">#{importOrder?.importRequestId}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">{getStatusTag(importOrder?.status)}</Descriptions.Item>
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
          <Descriptions.Item label="Ngày cập nhật">
            {importOrder?.updatedDate ? new Date(importOrder?.updatedDate).toLocaleDateString("vi-VN") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Ghi chú" span={3}>
            {importOrder?.note || "-"}
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
              dataSource={warehouseKeepers}
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
                  render: (status) => {
                    const statusMap = {
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
                  render: (_, record) => (
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
        title={`Tạo mã QR cho sản phẩm: ${selectedRecord?.itemName}`}
        open={qrModalVisible}
        onCancel={handleCloseQrModal}
        footer={[
          <Button key="cancel" onClick={handleCloseQrModal}>
            Hủy
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={qrGenerating}
            onClick={handleGenerateQrCodes}
          >
            Tạo mã QR
          </Button>,
        ]}
      >
        <div className="my-4">
          <p>Sản phẩm: {selectedRecord?.itemName}</p>
          <p>Mã sản phẩm: {selectedRecord?.itemId}</p>
          <p>Chi tiết đơn nhập ID: {selectedRecord?.importOrderDetailId}</p>
          
          <div className="mt-4">
            <label className="block mb-2">Số lượng mã QR cần tạo:</label>
            <InputNumber
              min={1}
              max={100}
              value={numberOfQrCodes}
              onChange={setNumberOfQrCodes}
              className="w-full"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ImportOrderDetail;