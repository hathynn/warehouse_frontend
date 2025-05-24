import { useState, useEffect, useCallback, JSX, useMemo } from "react";
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
import DetailCard, { type DetailInfoItem } from "@/components/commons/DetailCard";
import StatusTag from "@/components/commons/StatusTag";
import { ImportRequestData } from "../import-request-list";
import useProviderService from "@/hooks/useProviderService";
import useImportOrderService, { ImportOrderResponse } from "@/hooks/useImportOrderService";
import useImportOrderDetailService, { ImportOrderDetailResponse } from "@/hooks/useImportOrderDetailService";

interface RouteParams extends Record<string, string> {
  importRequestId: string;
}

interface PaginationType {
  current: number;
  pageSize: number;
  total: number;
}

type ImportType = "ORDER" | "RETURN";

const ImportRequestDetail: React.FC = () => {
  const { importRequestId } = useParams<RouteParams>();
  const navigate = useNavigate();

  const [importRequestData, setImportRequestData] = useState<ImportRequestData | null>(null);
  const [importRequestDetails, setImportRequestDetails] = useState<ImportRequestDetailResponse[]>([]);
  const [importOrders, setImportOrders] = useState<ImportOrderResponse[]>([]);
  const [importOrderDetails, setImportOrderDetails] = useState<ImportOrderDetailResponse[]>([]);
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
    getImportRequestDetails,
  } = useImportRequestDetailService();

  const {
    getAllImportOrdersByImportRequestId,
  } = useImportOrderService();

  const {
    getImportOrderDetailsPaginated,
  } = useImportOrderDetailService();

  const {
    getProviderById
  } = useProviderService();

  useEffect(() => {
    if (importRequestId) {
      fetchImportRequestData();
    }
  }, [importRequestId]);

  useEffect(() => {
    if (importRequestId) {
      fetchImportRequestDetails();
    }
  }, []);

  useEffect(() => {
    if (importRequestId) {
      fetchImportOrders();
    }
  }, [importRequestId]);

  const {
    totalExpectQuantityInRequest,
    totalOrderedQuantityInRequest,
    totalActualQuantityInRequest,
  } = useMemo(() => {
    if (!importRequestDetails || importRequestDetails.length === 0) {
      return {
        totalExpectQuantityInRequest: 0,
        totalOrderedQuantityInRequest: 0,
        totalActualQuantityInRequest: 0,
      };
    }

    return importRequestDetails.reduce(
      (totals, detail) => ({
        totalExpectQuantityInRequest: totals.totalExpectQuantityInRequest + (detail.expectQuantity || 0),
        totalOrderedQuantityInRequest: totals.totalOrderedQuantityInRequest + (detail.orderedQuantity || 0),
        totalActualQuantityInRequest: totals.totalActualQuantityInRequest + (detail.actualQuantity || 0),
      }),
      {
        totalExpectQuantityInRequest: 0,
        totalOrderedQuantityInRequest: 0,
        totalActualQuantityInRequest: 0,
      }
    );
  }, [importRequestDetails]);

  const fetchImportRequestData = useCallback(async () => {
    if (!importRequestId) return;
    try {
      setLoading(true);
      const response = await getImportRequestById(importRequestId);
      if (response?.content) {
        const importRequestData = response.content;
        const providerName = importRequestData.providerId ? (await getProviderById(importRequestData.providerId))?.content?.name : "-";
        setImportRequestData({
          ...importRequestData,
          providerName
        });
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
      const response = await getImportRequestDetails(
        importRequestId
      );
      if (response?.content) {
        setImportRequestDetails(response.content);
      }
    } catch (error) {
      console.error("Failed to fetch import request details:", error);
      message.error("Không thể tải danh sách chi tiết phiếu nhập");
    } finally {
      setDetailsLoading(false);
    }
  }, [importRequestId, getImportRequestDetails]);

  const fetchImportOrders = useCallback(async () => {
    if (!importRequestId) return;
    try {
      setDetailsLoading(true);
      const response = await getAllImportOrdersByImportRequestId(
        importRequestId
      );
      if (response?.content) {
        setImportOrders(response.content);
      }
    } catch (error) {
      console.error("Failed to fetch import orders:", error);
      message.error("Không thể tải danh sách đơn nhập");
    } finally {
      setDetailsLoading(false);
    }
  }, [importRequestId, getAllImportOrdersByImportRequestId]);

  const fetchImportOrderDetails = useCallback(async () => {
    if (!importRequestId) return;
    try {
      setDetailsLoading(true);
      const response = await getImportOrderDetailsPaginated(
        importRequestId
      );
      if (response?.content) {
        setImportOrderDetails(response.content);
      }
    } catch (error) {
      console.error("Failed to fetch import order details:", error);
      message.error("Không thể tải danh sách chi tiết đơn nhập");
    } finally {
      setDetailsLoading(false);
    }
  }, [importRequestId, getImportOrderDetailsPaginated]);

  useEffect(() => {
    if (importRequestId) {
      fetchImportOrderDetails();
    }
  }, [importRequestId]);

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

  const handleCreateImportOrder = (): void => {
    if (importRequestId) {
      navigate(ROUTES.PROTECTED.IMPORT.ORDER.CREATE_FROM_REQUEST(importRequestId), {
        state: {
          importRequestDetails,
        },
      });
    }
  };

  const handleViewImportOrders = (): void => {
    if (importRequestId) {
      navigate(ROUTES.PROTECTED.IMPORT.ORDER.LIST_FROM_REQUEST(importRequestId));
    }
  };

  const isAbleToCreateImportOrder = useMemo(() => {
    // Nếu phiếu nhập đã hoàn thành hoặc đã hủy, không hiển thị nút
    if (importRequestData?.status === "COMPLETED" || importRequestData?.status === "CANCELLED") {
      return false;
    }

    // Nếu không có import order hoặc tổng số lượng đã nhập bằng 0
    if (importOrders.length === 0 || totalActualQuantityInRequest === 0) {
      return totalExpectQuantityInRequest > totalOrderedQuantityInRequest;
    }

    // Kiểm tra nếu tất cả import orders đã completed
    if (importOrders.length > 0 && importOrders.every(order => order.status === "COMPLETED")) {
      return totalExpectQuantityInRequest > totalActualQuantityInRequest;
    }

    // Nếu có ít nhất một order chưa hoàn thành và có sản phẩm đã nhập
    if (totalActualQuantityInRequest > 0) {
      // Tính tổng ordered quantity của các order details chưa completed
      const totalOrderedQuantityOfIncompleteOrders = importOrders
        .filter(order => order.status !== "COMPLETED")
        .reduce((total, order) => {
          const orderDetails = importOrderDetails.filter(detail => detail.importOrderId === order.importOrderId);
          return total + orderDetails.reduce((sum, detail) => sum + (detail.expectQuantity || 0), 0);
        }, 0);

      return totalExpectQuantityInRequest > (totalActualQuantityInRequest + totalOrderedQuantityOfIncompleteOrders);
    }

    // Nếu không có import order hoặc không có sản phẩm đã nhập
    return false;
  }, [
    importRequestData?.status,
    importOrders,
    importOrderDetails,
    totalExpectQuantityInRequest,
    totalActualQuantityInRequest,
    totalOrderedQuantityInRequest
  ]);

  const columns: ColumnsType<ImportRequestDetailResponse> = [
    {
      width: '10%',
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      render: (id: number) => `#${id}`,
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: '30%',
      title: "Tên sản phẩm",
      dataIndex: "itemName",
      key: "itemName",
      ellipsis: true,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: "Dự nhập của phiếu",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: "Đã lên đơn nhập",
      dataIndex: "orderedQuantity",
      key: "orderedQuantity",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: "Thực tế đã nhập",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: '10%',
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusTag status={status} type="detail" />,
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    }
  ];

  if (loading && !importRequestData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Chuẩn bị dữ liệu cho DetailCard
  const infoItems = [
    { label: "Mã phiếu nhập", value: `#${importRequestData?.importRequestId}` },
    { label: "Loại nhập", value: importRequestData?.importType && getImportTypeText(importRequestData.importType as ImportType) },
    { label: "Trạng thái", value: <StatusTag status={importRequestData?.status || ""} type="import" /> },
    { label: "Nhà cung cấp", value: importRequestData?.providerName },
    { label: "Người tạo", value: importRequestData?.createdBy },
    { label: "Ngày tạo", value: importRequestData?.createdDate ? new Date(importRequestData.createdDate).toLocaleDateString("vi-VN") : "-" },
    importRequestData?.exportRequestId ? { label: "Mã phiếu xuất liên quan", value: `#${importRequestData.exportRequestId}` } : null,
    { label: "Lý do nhập", value: importRequestData?.importReason, span: 2 },
  ].filter(Boolean) as DetailInfoItem[];

  return (
    <div className="mx-auto p-3 pt-0">
      <div className="flex items-center mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(ROUTES.PROTECTED.IMPORT.REQUEST.LIST)}
          className="mr-4"
        >
          Quay lại
        </Button>
      </div>
      <div className="flex items-center mb-4">
        <h1 className="text-xl font-bold m-0">Chi tiết phiếu nhập #{importRequestData?.importRequestId}</h1>
        <div className="ml-auto space-x-3">
          {importRequestData?.importOrdersId && importRequestData.importOrdersId.length > 0 && (
            <Button
              type="primary"
              icon={<UnorderedListOutlined />}
              onClick={handleViewImportOrders}
            >
              Xem đơn nhập của phiếu #{importRequestData?.importRequestId}
            </Button>
          )}
          {isAbleToCreateImportOrder === true && (
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={handleCreateImportOrder}
            >
              Tạo đơn nhập cho phiếu #{importRequestData?.importRequestId}
            </Button>
          )}
        </div>
      </div>

      <DetailCard title="Thông tin phiếu nhập" items={infoItems} />

      <div className="flex justify-between items-center mt-12 mb-4">
        <h2 className="text-lg font-semibold">Danh sách chi tiết sản phẩm</h2>
      </div>

      <Table
        columns={columns}
        dataSource={importRequestDetails}
        rowKey="importRequestDetailId"
        loading={detailsLoading}
        onChange={(pagination) => handleTableChange(pagination as PaginationType)}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          locale: {
            items_per_page: "/ trang"
          },
          showTotal: (total) => `Tổng cộng ${total} sản phẩm trong phiếu nhập`,
        }}
      />
    </div>
  );
};

export default ImportRequestDetail;
