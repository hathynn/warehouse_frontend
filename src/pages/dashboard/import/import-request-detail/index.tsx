import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Spin
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
import useExportRequestService, { ExportRequestResponse } from "@/services/useExportRequestService";
import useDepartmentService, { DepartmentResponse } from "@/services/useDepartmentService";
import useItemService, { ItemResponse } from "@/services/useItemService";
import useImportOrderDetailService, { ImportOrderDetailResponse } from "@/services/useImportOrderDetailService";
import useConfigurationService, { ConfigurationDto } from "@/services/useConfigurationService";
import { getMinDateTime } from "@/utils/helpers";
import dayjs from "dayjs";
import { toast } from "react-toastify";

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
  // ========== ROUTER & PARAMS ==========
  const { importRequestId } = useParams<RouteParams>();
  const navigate = useNavigate();

  // ========== DATA STATES ==========
  const [importRequestData, setImportRequestData] = useState<ImportRequestData | null>(null);
  const [importRequestDetails, setImportRequestDetails] = useState<ImportRequestDetailResponse[]>([]);
  const [importOrders, setImportOrders] = useState<ImportOrderResponse[]>([]);
  const [importOrderDetails, setImportOrderDetails] = useState<ImportOrderDetailResponse[]>([]);
  const [configuration, setConfiguration] = useState<ConfigurationDto | null>(null);
  const [exportRequestData, setExportRequestData] = useState<ExportRequestResponse | null>(null);
  const [departmentData, setDepartmentData] = useState<DepartmentResponse | null>(null);
  const [itemsData, setItemsData] = useState<ItemResponse[]>([]);

  // ========== PAGINATION STATE ==========
  const [pagination, setPagination] = useState<PaginationType>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ========== SERVICES ==========
  const {
    loading: importRequestLoading,
    getImportRequestById
  } = useImportRequestService();

  const {
    loading: importRequestDetailLoading,
    getImportRequestDetails
  } = useImportRequestDetailService();

  const {
    getImportOrderDetailsPaginated
  } = useImportOrderDetailService();

  const {
    getAllImportOrdersByImportRequestId
  } = useImportOrderService();

  const {
    loading: providerLoading,
    getProviderById
  } = useProviderService();

  const {
    getConfiguration
  } = useConfigurationService();

  const {
    loading: exportRequestLoading,
    getExportRequestById
  } = useExportRequestService();

  const {
    loading: departmentLoading,
    getDepartmentById
  } = useDepartmentService();

  const {
    loading: itemLoading,
    getItems
  } = useItemService();

  // ========== UTILITY FUNCTIONS ==========
  const getImportTypeText = (type: ImportType): string => {
    const typeMap: Record<ImportType, string> = {
      "ORDER": "Nhập theo kế hoạch",
      "RETURN": "Nhập trả"
    };
    return typeMap[type] || type;
  };

  // ========== COMPUTED VALUES & CALCULATIONS ==========
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

  const getInfoItems = (): DetailInfoItem[] => {
    const baseItems: DetailInfoItem[] = [
      { label: "Mã phiếu nhập", value: `#${importRequestData?.importRequestId}` },
      { label: "Loại nhập", value: importRequestData?.importType && getImportTypeText(importRequestData.importType as ImportType) },
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
      { label: "Trạng thái", value: <StatusTag status={importRequestData?.status || ""} type="import" /> },
    ];

    // For ORDER type, show provider information
    if (importRequestData?.importType === "ORDER") {
      baseItems.splice(2, 0, { label: "Nhà cung cấp", value: importRequestData?.providerName });
    }

    // For RETURN type, show export request related information
    if (importRequestData?.importType === "RETURN") {
      if (importRequestData?.exportRequestId) {
        baseItems.splice(2, 0, { label: "Mã phiếu xuất liên quan", value: `#${importRequestData.exportRequestId}` });
      }

      // Add related information section
      if (exportRequestData || departmentData) {
        baseItems.push({
          label: "Thông tin liên hệ",
          value: (
            <div className="space-y-1">
              {departmentData && (
                <div><strong>Phòng ban:</strong> {departmentData.departmentName}</div>
              )}
              {exportRequestData && (
                <>
                  <div><strong>Cá nhân:</strong> {exportRequestData.receiverName || "-"}</div>
                  <div><strong>Số điện thoại:</strong> {exportRequestData.receiverPhone || "-"}</div>
                </>
              )}
            </div>
          ),
          span: 1
        });
      }
    }

    baseItems.push({ label: "Lý do nhập", value: importRequestData?.importReason, span: 2 });

    return baseItems.filter(Boolean) as DetailInfoItem[];
  };

  // ========== USE EFFECTS ==========
  useEffect(() => {
    if (!importRequestId) return;
    fetchImportRequestData();
  }, [importRequestId]);

  useEffect(() => {
    if (!importRequestId) return;
    fetchImportRequestDetails();
  }, [importRequestId]);

  useEffect(() => {
    if (!importRequestId) return;
    fetchImportOrders();
  }, [importRequestId]);

  useEffect(() => {
    if (!importRequestId) return;
    fetchImportOrderDetails();
  }, [importRequestId]);

  useEffect(() => {
    fetchItems();
    fetchConfiguration();
  }, []);

  useEffect(() => {
    if (importRequestData?.importType === "RETURN" && importRequestData?.exportRequestId) {
      fetchExportRequestData();
    }
  }, [importRequestData?.exportRequestId, importRequestData?.importType]);

  // ========== DATA FETCHING FUNCTIONS ==========
  const fetchImportRequestData = async () => {
    if (!importRequestId) return;

    const response = await getImportRequestById(importRequestId);
    if (response?.content) {
      const data = response.content;
      const providerName = data.providerId
        ? (await getProviderById(data.providerId))?.content?.name
        : "-";
      setImportRequestData({ ...data, providerName });
    }
  };

  const fetchImportRequestDetails = async () => {
    if (!importRequestId) return;

    const response = await getImportRequestDetails(importRequestId);
    if (response?.content) {
      setImportRequestDetails(response.content);
    }
  };

  const fetchImportOrders = async () => {
    if (!importRequestId) return;

    const response = await getAllImportOrdersByImportRequestId(importRequestId);
    if (response?.content) {
      setImportOrders(response.content);
    }
  };

  const fetchImportOrderDetails = async () => {
    if (!importRequestId || !importOrders.length) return;

    const importOrderDetailsPromises = importOrders.map(order =>
      getImportOrderDetailsPaginated(order.importOrderId)
    );

    const responses = await Promise.all(importOrderDetailsPromises);
    const allImportOrderDetails = responses
      .filter(response => response?.content)
      .flatMap(response => response.content);

    setImportOrderDetails(allImportOrderDetails);
  };

  const fetchConfiguration = async () => {
    const config = await getConfiguration();
    if (config) {
      setConfiguration(config);
    }
  };

  const fetchExportRequestData = async () => {
    if (!importRequestData?.exportRequestId) return;

    const response = await getExportRequestById(importRequestData.exportRequestId);
    setExportRequestData(response);

    // Fetch department data if departmentId exists
    if (response.departmentId) {
      const deptResponse = await getDepartmentById(response.departmentId);
      if (deptResponse?.content) {
        setDepartmentData(deptResponse.content);
      }
    }
  };

  const fetchItems = async () => {
    const response = await getItems();
    if (response?.content) {
      setItemsData(response.content);
    }

  };

  // ========== NAVIGATION HANDLERS ==========
  const handleBack = () => {
    navigate(ROUTES.PROTECTED.IMPORT.REQUEST.LIST);
  };

  // ========== EVENT HANDLERS ==========
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
          toast.error("Đã hết hạn tạo đơn nhập cho phiếu này!");
          // Re-fetch import request data
          fetchImportRequestData();
          return;
        }
      } catch (error) {
        console.error("Error checking import order creation time:", error);
        toast.error("Có lỗi xảy ra khi kiểm tra thời gian tạo đơn nhập!");
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

  // ========== UTILITY FUNCTIONS FOR ITEM DATA ==========
  const getItemInfo = (itemId: string) => {
    return itemsData.find(item => String(item.id) === String(itemId));
  };

  // ========== COMPUTED VALUES & RENDER LOGIC ==========
  const getColumns = (importType: string): ColumnsType<ImportRequestDetailResponse> => {
    const baseColumns: ColumnsType<ImportRequestDetailResponse> = [
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
      }
    ];

    if (importType === 'ORDER') {
      baseColumns.push(
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
        }
      );
    } else if (importType === 'RETURN') {
      baseColumns.push(
        {
          title: "Dự nhập của phiếu",
          dataIndex: "expectMeasurementValue",
          key: "expectMeasurementValue",
          align: "right" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (measurementValue: number, record: ImportRequestDetailResponse) => {
            const itemInfo = getItemInfo(record.itemId);
            return (
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>{measurementValue || 0}</span>{" "}
                {itemInfo?.unitType && (
                  <span>{itemInfo.measurementUnit}</span>
                )}
              </div>
            );
          },
        },
        {
          title: "Đã lên đơn nhập",
          dataIndex: "orderedMeasurementUnit",
          key: "orderedMeasurementUnit",
          align: "right" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (measurementValue: number, record: ImportRequestDetailResponse) => {
            const itemInfo = getItemInfo(record.itemId);
            return (
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>{measurementValue || 0}</span>{" "}
                {itemInfo?.unitType && (
                  <span>{itemInfo.measurementUnit}</span>
                )}
              </div>
            );
          },
        },
        {
          title: "Thực tế đã nhập",
          dataIndex: "actualMeasurementValue",
          key: "actualMeasurementValue",
          align: "right" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (measurementValue: number, record: ImportRequestDetailResponse) => {
            const itemInfo = getItemInfo(record.itemId);
            return (
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>{measurementValue || 0}</span>{" "}
                {itemInfo?.unitType && (
                  <span>{itemInfo.measurementUnit}</span>
                )}
              </div>
            );
          },
        }
      );
    }

    baseColumns.push({
      width: '10%',
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusTag status={status} type="detail" />,
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    });

    return baseColumns;
  };

  // Show loading spinner when initially loading the page
  if ((importRequestLoading || providerLoading || exportRequestLoading || departmentLoading || itemLoading) && !importRequestData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-3 pt-0 mx-auto">
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
        <h1 className="m-0 text-xl font-bold">Chi tiết phiếu nhập #{importRequestData?.importRequestId}</h1>
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

      <DetailCard title="Thông tin phiếu nhập" items={getInfoItems()} />

      <div className="flex items-center justify-between mt-12 mb-4">
        <h2 className="text-lg font-semibold">Danh sách chi tiết sản phẩm</h2>
      </div>

      <Table
        columns={getColumns(importRequestData?.importType || 'ORDER')}
        dataSource={importRequestDetails}
        rowKey="importRequestDetailId"
        loading={itemLoading}
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
