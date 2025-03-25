import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Table,
  Button,
  Card,
  Descriptions,
  Tag,
  Spin,
  message
} from "antd";
import { ArrowLeftOutlined, FileAddOutlined, UnorderedListOutlined } from "@ant-design/icons";
import useImportRequestService from "../../../../hooks/useImportRequestService";
import { DEPARTMENT_ROUTER } from "@/constants/routes";

const ImportRequestDetail = () => {
  const { importRequestId } = useParams();
  const navigate = useNavigate();
  const [importRequest, setImportRequest] = useState(null);
  const [importRequestDetails, setImportRequestDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const {
    getImportRequestById,
    getImportRequestDetails,
  } = useImportRequestService();

  // Fetch import request data
  const fetchImportRequestData = useCallback(async () => {
    if (!importRequestId) return;

    try {
      setLoading(true);
      const data = await getImportRequestById(parseInt(importRequestId));
      setImportRequest(data);
    } catch (error) {
      console.error("Failed to fetch import request:", error);
      message.error("Không thể tải thông tin phiếu nhập");
    } finally {
      setLoading(false);
    }
  }, [importRequestId, getImportRequestById]);

  // Fetch import request details with pagination
  const fetchImportRequestDetails = useCallback(async () => {
    if (!importRequestId) return;

    try {
      setDetailsLoading(true);
      const { current, pageSize } = pagination;
      const response = await getImportRequestDetails(
        parseInt(importRequestId),
        current,
        pageSize
      );

      if (response && response.content) {
        setImportRequestDetails(response.content);

        // Update pagination with metadata from response
        setPagination(prev => ({
          ...prev,
          current: response.metaDataDTO.page,
          pageSize: response.metaDataDTO.limit,
          total: response.metaDataDTO.total,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch import request details:", error);
      message.error("Không thể tải danh sách chi tiết phiếu nhập");
    } finally {
      setDetailsLoading(false);
    }
  }, [importRequestId, getImportRequestDetails]);

  useEffect(() => {
    fetchImportRequestData();
  }, []);

  // Load details when pagination changes
  useEffect(() => {
    fetchImportRequestDetails();
  }, []);

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

  // Import type text renderer
  const getImportTypeText = (type) => {
    const typeMap = {
      "ORDER": "Nhập theo kế hoạch",
      "RETURN": "Nhập trả"
    };

    return typeMap[type] || type;
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

  const handleCreateImportOrder = () => {
    navigate(DEPARTMENT_ROUTER.IMPORT.ORDER.CREATE__FROM_IMPORT_REQUEST_ID(importRequestId));
  };
  
  const handleViewImportOrders = () => {
    navigate(DEPARTMENT_ROUTER.IMPORT.ORDER.LIST_FROM_IMPORT_REQUEST_ID(importRequestId));
  };

  // Table columns definition
  const columns = [
    {
      title: "Mã chi tiết",
      dataIndex: "importRequestDetailId",
      key: "importRequestDetailId",
      render: (id) => `#${id}`,
    },
    {
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "itemName",
      key: "itemName",
      ellipsis: true,
    },
    {
      title: "Số lượng nhập dự kiến",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
    },
    {
      title: "Số lượng nhập thực tế",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: getStatusTag,
    }
  ];

  // Show loading spinner when initially loading the page
  if (loading && !importRequest) {
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
        <h1 className="text-xl font-bold m-0">Chi tiết phiếu nhập #{importRequest?.importRequestId}</h1>
      </div>

      <Card className="mb-6">
        <Descriptions title="Thông tin phiếu nhập" bordered>
          <Descriptions.Item label="Mã phiếu nhập">#{importRequest?.importRequestId}</Descriptions.Item>
          <Descriptions.Item label="Loại nhập">{getImportTypeText(importRequest?.importType)}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">{getStatusTag(importRequest?.status)}</Descriptions.Item>
          <Descriptions.Item label="Lý do nhập" span={2}>{importRequest?.importReason}</Descriptions.Item>
          <Descriptions.Item label="Mã nhà cung cấp">{importRequest?.providerId}</Descriptions.Item>
          <Descriptions.Item label="Người tạo">{importRequest?.createdBy}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {importRequest?.createdDate ? new Date(importRequest?.createdDate).toLocaleDateString("vi-VN") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày cập nhật">
            {importRequest?.updatedDate ? new Date(importRequest?.updatedDate).toLocaleDateString("vi-VN") : "-"}
          </Descriptions.Item>
          {importRequest?.exportRequestId && (
            <Descriptions.Item label="Mã phiếu xuất liên quan">
              #{importRequest?.exportRequestId}
            </Descriptions.Item>
          )}
          {importRequest?.importOrdersId && importRequest?.importOrdersId.length > 0 && (
            <Descriptions.Item label="Đơn nhập hàng liên quan" span={3}>
              {importRequest?.importOrdersId.map(orderId => (
                <Tag key={orderId} color="blue" className="mr-2 mb-1">#{orderId}</Tag>
              ))}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <div className="flex justify-between items-center mt-16 mb-4">
        <h2 className="text-lg font-semibold">Danh sách chi tiết sản phẩm</h2>
        <div className="space-x-3">
          {importRequest?.importOrdersId && importRequest?.importOrdersId.length > 0 && (
            <Button
              type="primary"
              icon={<UnorderedListOutlined />}
              onClick={handleViewImportOrders}
            >
              Xem danh sách đơn nhập
            </Button>
          )}
          {importRequest?.status !== "COMPLETED" && importRequest?.status !== "CANCELLED" && (
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={handleCreateImportOrder}
            >
              Tạo đơn nhập hàng
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={importRequestDetails}
        rowKey="importRequestDetailId"
        loading={detailsLoading}
        onChange={handleTableChange}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['10', '50'],
          showTotal: (total) => `Tổng cộng ${total} sản phẩm trong phiếu nhập`,
        }}
      />
    </div>
  );
};

export default ImportRequestDetail;
