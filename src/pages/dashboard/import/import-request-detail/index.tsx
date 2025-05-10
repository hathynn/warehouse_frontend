import { useState, useEffect, useCallback, JSX } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Card,
  Spin,
  message
} from "antd";
import { ArrowLeftOutlined, FileAddOutlined, UnorderedListOutlined } from "@ant-design/icons";
import useImportRequestService, { ImportRequestResponse } from "@/hooks/useImportRequestService";
import useImportRequestDetailService, { ImportRequestDetailResponse } from "@/hooks/useImportRequestDetailService";
import { ColumnsType } from "antd/es/table";
import { ROUTES } from "@/constants/routes";
import DetailCard from "@/components/commons/DetailCard";
import StatusTag from "@/components/commons/StatusTag";

interface RouteParams extends Record<string, string> {
  importRequestId?: string;
}

interface PaginationType {
  current: number;
  pageSize: number;
  total: number;
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
      render: (id: number) => `#${id}`,
      width: "10%",
      align: "right" as const,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "itemName",
      key: "itemName",
      ellipsis: true,
      width: "30%",
    },
    {
      title: "Dự nhập của phiếu",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
      align: "right" as const,
    },
    {
      title: "Đã lên đơn nhập",
      dataIndex: "orderedQuantity",
      key: "orderedQuantity",
      align: "right" as const,
    },
    {
      title: "Thực tế đã nhập",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      align: "right" as const,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusTag status={status} type="detail" />,
      width: '10%',
      align: "center" as const,
    }
  ];

  if (loading && !importRequest) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Chuẩn bị dữ liệu cho DetailCard
  const infoItems = [
    { label: "Mã phiếu nhập", value: `#${importRequest?.importRequestId}` },
    { label: "Loại nhập", value: importRequest?.importType && getImportTypeText(importRequest.importType as ImportType) },
    { label: "Trạng thái", value: <StatusTag status={importRequest?.status || ""} type="import" /> },
    { label: "Mã nhà cung cấp", value: importRequest?.providerId },
    { label: "Người tạo", value: importRequest?.createdBy },
    { label: "Ngày tạo", value: importRequest?.createdDate ? new Date(importRequest.createdDate).toLocaleDateString("vi-VN") : "-" },
    importRequest?.exportRequestId ? { label: "Mã phiếu xuất liên quan", value: `#${importRequest.exportRequestId}` } : null,
    { label: "Lý do nhập", value: importRequest?.importReason, span: 2 },
  ].filter(Boolean);

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
              Xem đơn nhập của phiếu #{importRequest?.importRequestId}
            </Button>
          )}
          {importRequest?.status !== "COMPLETED" && importRequest?.status !== "CANCELLED" && (
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={handleCreateImportOrder}
            >
              Tạo đơn nhập cho phiếu #{importRequest?.importRequestId}
            </Button>
          )}
        </div>
      </div>

      <DetailCard title="Thông tin phiếu nhập" items={infoItems} />

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
