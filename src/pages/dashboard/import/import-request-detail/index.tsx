import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Spin,
  message
} from "antd";
import { ArrowLeftOutlined, FileAddOutlined, UnorderedListOutlined } from "@ant-design/icons";
import useImportRequestService from "@/services/useImportRequestService";
import useImportRequestDetailService, { ImportRequestDetailResponse } from "@/services/useImportRequestDetailService";
import { ColumnsType } from "antd/es/table";
import { ROUTES } from "@/constants/routes";
import DetailCard, { type DetailInfoItem } from "@/components/commons/DetailCard";
import StatusTag from "@/components/commons/StatusTag";
import { ImportRequestData } from "../import-request-list";
import useProviderService from "@/services/useProviderService";
import useImportOrderService, { ImportOrderResponse } from "@/services/useImportOrderService";
import useImportOrderDetailService, { ImportOrderDetailResponse } from "@/services/useImportOrderDetailService";
import useConfigurationService, { ConfigurationDto } from "@/services/useConfigurationService";
import { getMinDateTime } from "@/utils/helpers";
import dayjs from "dayjs";

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
  const [configuration, setConfiguration] = useState<ConfigurationDto | null>(null);
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

  const {
    getConfiguration
  } = useConfigurationService();

  useEffect(() => {
    if (!importRequestId) return;
    const fetchImportRequestData = async () => {
      setLoading(true);
      try {
        const response = await getImportRequestById(importRequestId);
        if (response?.content) {
          const data = response.content;
          const providerName = data.providerId
            ? (await getProviderById(data.providerId))?.content?.name
            : "-";
          setImportRequestData({ ...data, providerName });
        }
      } catch (error) {
        console.error("Failed to fetch import request:", error);
        message.error("Không thể tải thông tin phiếu nhập");
      } finally {
        setLoading(false);
      }
    };
    fetchImportRequestData();
  }, [importRequestId]);

  useEffect(() => {
    if (!importRequestId) return;
    const fetchImportRequestDetails = async () => {
      setDetailsLoading(true);
      try {
        const response = await getImportRequestDetails(importRequestId);
        if (response?.content) {
          setImportRequestDetails(response.content);
        }
      } catch (error) {
        console.error("Failed to fetch import request details:", error);
        message.error("Không thể tải danh sách chi tiết phiếu nhập");
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchImportRequestDetails();
  }, [importRequestId]);

  useEffect(() => {
    if (!importRequestId) return;
    const fetchImportOrders = async () => {
      setDetailsLoading(true);
      try {
        const response = await getAllImportOrdersByImportRequestId(importRequestId);
        if (response?.content) {
          setImportOrders(response.content);
        }
      } catch (error) {
        console.error("Failed to fetch import orders:", error);
        message.error("Không thể tải danh sách đơn nhập");
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchImportOrders();
  }, [importRequestId]);

  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        const config = await getConfiguration();
        if (config) {
          setConfiguration(config);
        }
      } catch (error) {
        console.error("Error fetching configuration:", error);
      }
    };
    fetchConfiguration();
  }, []);

  let totalExpectQuantityInRequest = 0;
  let totalOrderedQuantityInRequest = 0;
  let totalActualQuantityInRequest = 0;
  if (importRequestDetails && importRequestDetails.length > 0) {
    importRequestDetails.forEach(detail => {
      totalExpectQuantityInRequest += detail.expectQuantity || 0;
      totalOrderedQuantityInRequest += detail.orderedQuantity || 0;
      totalActualQuantityInRequest += detail.actualQuantity || 0;
    });
  }

  let isImportOrderCreationExpired = false;
  if (configuration && importRequestData?.endDate) {
    const currentDateTime = dayjs();
    const importRequestEndDate = dayjs(importRequestData.endDate).endOf('day');
    if (currentDateTime.isSame(importRequestEndDate, 'day')) {
      try {
        const minDateTime = getMinDateTime(
          'import-order-create',
          configuration,
          currentDateTime,
          importRequestData
        );
        isImportOrderCreationExpired = minDateTime.isAfter(importRequestEndDate);
      } catch (error) {
        console.error("Error checking import order creation time:", error);
      }
    }
  }

  let isAbleToCreateImportOrder = false;
  if (importRequestData?.status === "COMPLETED" || importRequestData?.status === "CANCELLED") {
    isAbleToCreateImportOrder = false;
  } else if (isImportOrderCreationExpired) {
    isAbleToCreateImportOrder = false;
  } else if (importOrders.length === 0 || totalActualQuantityInRequest === 0) {
    isAbleToCreateImportOrder = totalExpectQuantityInRequest > totalOrderedQuantityInRequest;
  } else if (importOrders.length > 0 && importOrders.every(order => order.status === "COMPLETED")) {
    isAbleToCreateImportOrder = totalExpectQuantityInRequest > totalActualQuantityInRequest;
  } else if (totalActualQuantityInRequest > 0) {
    const totalOrderedQuantityOfIncompleteOrders = importOrders
      .filter(order => order.status !== "COMPLETED")
      .reduce((total, order) => {
        const orderDetails = importOrderDetails.filter(detail => detail.importOrderId === order.importOrderId);
        return total + orderDetails.reduce((sum, detail) => sum + (detail.expectQuantity || 0), 0);
      }, 0);
    isAbleToCreateImportOrder = totalExpectQuantityInRequest > (totalActualQuantityInRequest + totalOrderedQuantityOfIncompleteOrders);
  } else {
    isAbleToCreateImportOrder = false;
  }

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
    if (!importRequestId) return;

    // Kiểm tra lại thời gian hết hạn trước khi tạo đơn nhập
    if (!configuration || !importRequestData?.endDate) {
      navigate(ROUTES.PROTECTED.IMPORT.ORDER.CREATE_FROM_REQUEST(importRequestId), {
        state: {
          importRequestDetails,
        },
      });
      return;
    }

    const currentDateTime = dayjs();
    const importRequestEndDate = dayjs(importRequestData.endDate).endOf('day');
    
    // Kiểm tra nếu ngày hiện tại là ngày kết thúc
    if (currentDateTime.isSame(importRequestEndDate, 'day')) {
      try {
        const minDateTime = getMinDateTime(
          'import-order-create',
          configuration,
          currentDateTime,
          importRequestData
        );
        
        // Nếu thời gian tối thiểu vượt quá ngày kết thúc, đã hết hạn
        if (minDateTime.isAfter(importRequestEndDate)) {
          message.error("Đã hết hạn tạo đơn nhập cho phiếu này!");
          // Re-fetch import request data
          (async () => {
            setLoading(true);
            try {
              const response = await getImportRequestById(importRequestId!);
              if (response?.content) {
                const data = response.content;
                const providerName = data.providerId
                  ? (await getProviderById(data.providerId))?.content?.name
                  : "-";
                setImportRequestData({ ...data, providerName });
              }
            } catch (error) {
              console.error("Failed to refresh import request:", error);
            } finally {
              setLoading(false);
            }
          })();
          return;
        }
      } catch (error) {
        console.error("Error checking import order creation time:", error);
        message.error("Có lỗi xảy ra khi kiểm tra thời gian tạo đơn nhập!");
        return;
      }
    }

    // Nếu chưa hết hạn, tiếp tục tạo đơn nhập
    navigate(ROUTES.PROTECTED.IMPORT.ORDER.CREATE_FROM_REQUEST(importRequestId), {
      state: {
        importRequestDetails,
      },
    });
  };

  const handleViewImportOrders = (): void => {
    if (importRequestId) {
      navigate(ROUTES.PROTECTED.IMPORT.ORDER.LIST_FROM_REQUEST(importRequestId));
    }
  };

  // Memoize columns to prevent recreation on each render
  const columns: ColumnsType<ImportRequestDetailResponse> = [
    {
      width: '15%',
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      render: (id: number) => `#${id}`,
      align: "left" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: '25%',
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

  // Memoize infoItems to avoid recomputing array on each render
  const infoItems: DetailInfoItem[] = [
    { label: "Mã phiếu nhập", value: `#${importRequestData?.importRequestId}` },
    { label: "Loại nhập", value: importRequestData?.importType && getImportTypeText(importRequestData.importType as ImportType) },
    { label: "Nhà cung cấp", value: importRequestData?.providerName },
    { label: "Ngày tạo", value: importRequestData?.createdDate ? dayjs(importRequestData.createdDate).format("DD-MM-YYYY") : "-" },
    { 
      label: "Thời gian hiệu lực", 
      value: (
        <span>
          Từ <strong>{importRequestData?.startDate ? dayjs(importRequestData.startDate).format("DD-MM-YYYY") : "-"}</strong>
          {importRequestData?.endDate ? (
            <> - Đến <strong>{dayjs(importRequestData.endDate).format("DD-MM-YYYY")}</strong></>
          ) : null}
        </span>
      )
    },
    importRequestData?.exportRequestId ? { label: "Mã phiếu xuất liên quan", value: `#${importRequestData.exportRequestId}` } : null,
    { label: "Trạng thái", value: <StatusTag status={importRequestData?.status || ""} type="import" /> },
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
          {(isAbleToCreateImportOrder === true || isImportOrderCreationExpired) && (
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={handleCreateImportOrder}
              disabled={isImportOrderCreationExpired}
            >
              {isImportOrderCreationExpired 
                ? "Đã hết hạn tạo đơn nhập" 
                : `Tạo đơn nhập cho phiếu #${importRequestData?.importRequestId}`
              }
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
