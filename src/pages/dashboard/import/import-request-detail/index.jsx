import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Table, 
  Button, 
  Card, 
  Descriptions, 
  Tag, 
  Spin, 
  Pagination, 
  Modal, 
  message 
} from "antd";
import { ArrowLeftOutlined, EditOutlined, FileAddOutlined } from "@ant-design/icons";
import useImportRequestService from "../../../../hooks/useImportRequestService";

const ImportRequestDetail = () => {
  const { importRequestId } = useParams();
  const navigate = useNavigate();
  const [importRequest, setImportRequest] = useState(null);
  const [importRequestDetails, setImportRequestDetails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const { 
    getImportRequestDetails,
    updateImportRequestDetails
  } = useImportRequestService();

  useEffect(() => {
    fetchImportRequestDetails();
  }, [importRequestId, currentPage, pageSize]);

  const fetchImportRequestDetails = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would also fetch the import request data
      // For now, we'll focus on the details
      const data = await getImportRequestDetails(parseInt(importRequestId), currentPage, pageSize);
      setImportRequestDetails(data);
      setTotal(data.length > 0 ? data.length * 10 : 0); // Temporary solution until API provides total
      
      // Mock import request data (in real implementation, this would come from an API call)
      setImportRequest({
        importRequestId: parseInt(importRequestId),
        importReason: "Nhập hàng theo kế hoạch",
        importType: "ORDER",
        status: "IN_PROGRESS",
        providerId: 123,
        exportRequestId: null,
        importOrdersId: [456, 789],
        createdBy: "admin",
        updatedBy: "admin",
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch import request details:", error);
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "NOT_STARTED":
        return <Tag color="default">Chưa bắt đầu</Tag>;
      case "IN_PROGRESS":
        return <Tag color="processing">Đang xử lý</Tag>;
      case "COMPLETED":
        return <Tag color="success">Hoàn tất</Tag>;
      case "CANCELLED":
        return <Tag color="error">Đã hủy</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getDetailStatusTag = (status) => {
    switch (status) {
      case "NOT_STARTED":
        return <Tag color="default">Chưa bắt đầu</Tag>;
      case "IN_PROGRESS":
        return <Tag color="processing">Đang xử lý</Tag>;
      case "COMPLETED":
        return <Tag color="success">Hoàn tất</Tag>;
      case "CANCELLED":
        return <Tag color="error">Đã hủy</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getImportTypeText = (type) => {
    switch (type) {
      case "ORDER":
        return "Đơn hàng";
      case "RETURN":
        return "Trả hàng";
      default:
        return type;
    }
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCreateImportOrder = () => {
    // Navigate to create import order page with the import request id
    navigate(`/import/order/create?importRequestId=${id}`);
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
      width: 70,
    },
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
      title: "Số lượng dự kiến",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
    },
    {
      title: "Số lượng thực tế",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => getDetailStatusTag(status),
    }
  ];

  if (loading) {
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
            {new Date(importRequest?.createdDate).toLocaleDateString("vi-VN")}
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

      <Table
        columns={columns}
        dataSource={importRequestDetails}
        pagination={false}
        rowKey="importRequestDetailId"
        className="mb-4"
      />

      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={total}
        onChange={handlePageChange}
        showSizeChanger
        showTotal={(total) => `Tổng ${total} chi tiết`}
      />
    </div>
  );
};

export default ImportRequestDetail;
