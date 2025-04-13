import { useState, useEffect, useCallback, JSX } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import useImportRequestService, { ImportRequestResponse } from "@/hooks/useImportRequestService";
import useImportRequestDetailService, { ImportRequestDetailResponse } from "@/hooks/useImportRequestDetailService";
import { ColumnsType } from "antd/es/table";
import { ROUTES } from "@/constants/routes";

interface RouteParams extends Record<string, string> {
  importRequestId?: string;
}

interface PaginationType {
  current: number;
  pageSize: number;
  total: number;
}

interface StatusConfig {
  color: string;
  text: string;
}

type ImportStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type ImportType = "ORDER" | "RETURN";

const ImportRequestDetail: React.FC = () => {
  const { importRequestId } = useParams<RouteParams>();
  const navigate = useNavigate();
  
  const [importRequest, setImportRequest] = useState<ImportRequestResponse | null>(null);
  const [importRequestDetails, setImportRequestDetails] = useState<ImportRequestDetailResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationType>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const {
    getImportRequestById,
  } = useImportRequestService();

  const {
    getImportRequestDetails
  } = useImportRequestDetailService();

  const fetchImportRequestData = useCallback(async () => {
    if (!importRequestId) return;
    
    try {
      setLoading(true);
      const response = await getImportRequestById(parseInt(importRequestId));
      if (response?.content) {
        setImportRequest(response.content);
      }
    } catch (error) {
      console.error("Failed to fetch import request:", error);
      message.error("Không thể tải thông tin phiếu nhập");
    } finally {
      setLoading(false);
    }
  }, [importRequestId, getImportRequestById]);

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

      if (response?.content) {
        setImportRequestDetails(response.content);

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
      console.error("Failed to fetch import request details:", error);
      message.error("Không thể tải danh sách chi tiết phiếu nhập");
    } finally {
      setDetailsLoading(false);
    }
  }, [importRequestId, pagination, getImportRequestDetails]);

  useEffect(() => {
    if (importRequestId) {
      fetchImportRequestData();
    }
  }, [importRequestId]);

  useEffect(() => {
    if (importRequestId) {
      fetchImportRequestDetails();
    }
  }, [pagination.current, pagination.pageSize]);

  const getStatusTag = (status: ImportStatus): JSX.Element => {
    const statusMap: Record<ImportStatus, StatusConfig> = {
      "NOT_STARTED": { color: "default", text: "Chưa bắt đầu" },
      "IN_PROGRESS": { color: "processing", text: "Đang xử lý" },
      "COMPLETED": { color: "success", text: "Hoàn tất" },
      "CANCELLED": { color: "error", text: "Đã hủy" }
    };

    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getImportTypeText = (type: ImportType): string => {
    const typeMap: Record<ImportType, string> = {
      "ORDER": "Nhập theo kế hoạch",
      "RETURN": "Nhập trả"
    };

    return typeMap[type] || type;
  };

  const handleTableChange = (newPagination: PaginationType): void => {
    setPagination({
      ...newPagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleBack = (): void => {
    navigate(ROUTES.PROTECTED.IMPORT.REQUEST.LIST);
  };

  const handleCreateImportOrder = (): void => {
    if (importRequestId) {
      navigate(ROUTES.PROTECTED.IMPORT.ORDER.CREATE_FROM_REQUEST(importRequestId));
    }
  };

  const handleViewImportOrders = (): void => {
    if (importRequestId) {
      navigate(ROUTES.PROTECTED.IMPORT.ORDER.LIST_FROM_REQUEST(importRequestId));
    }
  };

  const columns: ColumnsType<ImportRequestDetailResponse> = [
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
    },
    {
      title: "Số lượng phải nhập theo phiếu",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
    },
    {
      title: "Số lượng đã lên đơn nhập",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: ImportStatus) => getStatusTag(status),
    }
  ];

  if (loading && !importRequest) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="mx-auto p-5">
      <div className="flex items-center mb-4 justify-between">
        <div className="flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className="mr-4"
          >
            Quay lại
          </Button>
          <h1 className="text-xl font-bold m-0">Chi tiết phiếu nhập #{importRequest?.importRequestId}</h1>
        </div>
        <div className="space-x-3">
          {importRequest?.importOrdersId && importRequest.importOrdersId.length > 0 && (
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

      <Card className="mb-6">
        <Descriptions title="Thông tin phiếu nhập" bordered>
          <Descriptions.Item label="Mã phiếu nhập">#{importRequest?.importRequestId}</Descriptions.Item>
          <Descriptions.Item label="Loại nhập">{importRequest?.importType && getImportTypeText(importRequest.importType as ImportType)}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">{importRequest?.status && getStatusTag(importRequest.status as ImportStatus)}</Descriptions.Item>
          <Descriptions.Item label="Lý do nhập" span={2}>{importRequest?.importReason}</Descriptions.Item>
          <Descriptions.Item label="Mã nhà cung cấp">{importRequest?.providerId}</Descriptions.Item>
          <Descriptions.Item label="Người tạo">{importRequest?.createdBy}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {importRequest?.createdDate ? new Date(importRequest.createdDate).toLocaleDateString("vi-VN") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày cập nhật">
            {importRequest?.updatedDate ? new Date(importRequest.updatedDate).toLocaleDateString("vi-VN") : "-"}
          </Descriptions.Item>
          {importRequest?.exportRequestId && (
            <Descriptions.Item label="Mã phiếu xuất liên quan">
              #{importRequest.exportRequestId}
            </Descriptions.Item>
          )}
          {importRequest?.importOrdersId && importRequest.importOrdersId.length > 0 && (
            <Descriptions.Item label="Đơn nhập hàng liên quan" span={3}>
              {importRequest.importOrdersId.map(orderId => (
                <Tag key={orderId} color="blue" className="mr-2 mb-1">#{orderId}</Tag>
              ))}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
          
      <div className="flex justify-between items-center mt-12 mb-4">
        <h2 className="text-lg font-semibold">Danh sách chi tiết sản phẩm</h2>
      </div>

      <Table<ImportRequestDetailResponse>
        columns={columns}
        dataSource={importRequestDetails}
        rowKey="importRequestDetailId"
        loading={detailsLoading}
        onChange={(pagination) => handleTableChange(pagination as PaginationType)}
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
