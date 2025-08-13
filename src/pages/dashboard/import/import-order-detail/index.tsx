import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Spin,
  Modal,
  Checkbox,
} from "antd";
import {
  ArrowLeftOutlined,
  UserAddOutlined,
  PrinterOutlined,
  ClockCircleOutlined,
  RedoOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import useImportOrderService from "@/services/useImportOrderService";
import useImportOrderDetailService from "@/services/useImportOrderDetailService";
import useAccountService from "@/services/useAccountService";
import { ImportOrderResponse, ExtendImportOrderRequest } from "@/services/useImportOrderService";
import { ImportOrderDetailResponse } from "@/services/useImportOrderDetailService";
import { AccountResponse } from "@/services/useAccountService";
import { ROUTES } from "@/constants/routes";
import { useSelector } from "react-redux";
import { UserState } from "@/contexts/redux/features/userSlice";
import useConfigurationService, { ConfigurationDto } from "@/services/useConfigurationService";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import useInventoryItemService, { InventoryItemResponse } from "@/services/useInventoryItemService";
import useStoredLocationService, { StoredLocationResponse } from "@/services/useStoredLocationService";
import { usePusherContext } from "@/contexts/pusher/PusherContext";
dayjs.extend(duration);
import DetailCard from "@/components/commons/DetailCard";
import StatusTag from "@/components/commons/StatusTag";
import UpdateInventoryItemLocationModal from "@/components/import-flow/import-order/UpdateInventoryItemLocationModal";
import InventoryItemLocationConfirmModal from "@/components/import-flow/import-order/InventoryItemLocationConfirmModal";
import CountingConfirmModal from "@/components/import-flow/import-order/CountingConfirmModal";
import ExtendImportOrderModal from "@/components/import-flow/import-order/ExtendImportOrderModal";
import ImportOrderAssignStaffModal from "@/components/import-flow/import-order/ImportOrderAssignStaffModal";
import QrCodeListingModal from "@/components/import-flow/import-order/QrCodeListingModal";
import { AccountRole, ImportStatus } from "@/utils/enums";
import { toast } from "react-toastify";
import { MdApartment, MdLocationSearching } from "react-icons/md";
import { convertStoredLocationName } from "@/utils/helpers";
import useImportRequestService, { ImportRequestResponse } from "@/services/useImportRequestService";
import { ImportRequestDetailResponse } from "@/services/useImportRequestDetailService";
import useItemService, { ItemResponse } from "@/services/useItemService";

const ImportOrderDetail = () => {
  // ========== ROUTER & PARAMS ==========
  const { importOrderId } = useParams<{ importOrderId: string }>();
  const navigate = useNavigate();
  const userRole = useSelector((state: { user: UserState }) => state.user.role);

  // ========== PUSHER CONTEXT ==========
  const { latestNotification } = usePusherContext();

  // ========== DATA STATES ==========
  const [importOrderData, setImportOrderData] = useState<ImportOrderResponse | null>(null);
  const [importOrderDetails, setImportOrderDetails] = useState<ImportOrderDetailResponse[]>([]);
  const [importRequestRelated, setImportRequestRelated] = useState<ImportRequestResponse | null>(null);
  const [staffs, setStaffs] = useState<AccountResponse[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<AccountResponse | null>(null);
  const [configuration, setConfiguration] = useState<ConfigurationDto | null>(null);
  const [inventoryItemsData, setInventoryItemsData] = useState<InventoryItemResponse[]>([]);
  const [itemsData, setItemsData] = useState<ItemResponse[]>([]);

  // ========== MODAL STATES ==========
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [confirmCountingModalVisible, setConfirmCountingModalVisible] = useState(false);
  const [cancelImportOrderModalVisible, setCancelImportOrderModalVisible] = useState(false);
  const [confirmRequireCountingAgainModalVisible, setConfirmRequireCountingAgainModalVisible] = useState(false);
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [showUpdateInventoryItemLocationModal, setShowUpdateInventoryItemLocationModal] = useState(false);
  const [showInventoryItemsLocationConfirmModal, setShowInventoryItemsLocationConfirmModal] = useState(false);
  const [selectedItemForLocationUpdate, setSelectedItemForLocationUpdate] = useState<ImportOrderDetailResponse | null>(null);

  // ========== FORM & UI STATES ==========
  const [confirmRequireCountingAgainResponsibilityChecked, setConfirmRequireCountingAgainResponsibilityChecked] = useState(false);
  const [cancelImportOrderResponsibilityChecked, setCancelImportOrderResponsibilityChecked] = useState(false);

  // ========== PAGINATION STATE ==========
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ========== SERVICES ==========
  const {
    loading: importOrderLoading,
    getImportOrderById,
    assignStaff,
    cancelImportOrder,
    completeImportOrder,
    completeImportOrderReturn,
    extendImportOrder,
    updateImportOrderToReadyToStore,
    countAgainImportOrder
  } = useImportOrderService();
  const {
    getImportRequestById
  } = useImportRequestService();
  const {
    loading: importOrderDetailLoading,
    getImportOrderDetailsPaginated
  } = useImportOrderDetailService();
  const {
    loading: accountLoading,
    getActiveStaffsInDay,
    findAccountById
  } = useAccountService();
  const {
    getConfiguration
  } = useConfigurationService();
  const {
    loading: inventoryItemLoading,
    getByListImportOrderDetailIds,
    updateStoredLocation,
  } = useInventoryItemService();
  const {
    getItems
  } = useItemService();
  // ========== DATA FETCHING FUNCTIONS ==========
  const fetchImportOrderData = async () => {
    if (!importOrderId) return;
    const response = await getImportOrderById(importOrderId);
    if (response?.content) {
      setImportOrderData(response.content);
    }
  };

  const fetchImportOrderDetails = async () => {
    if (!importOrderId) return;
    const { current, pageSize } = pagination;
    const response = await getImportOrderDetailsPaginated(importOrderId, current, pageSize);
    if (response?.content) {
      setImportOrderDetails(response.content);
      if (response.metaDataDTO) {
        const { page, limit, total } = response.metaDataDTO;
        setPagination(prev => ({ ...prev, current: page, pageSize: limit, total: total }));
      }
    }
  };

  const fetchImportRequestRelated = async () => {
    if (!importOrderData?.importRequestId) return;
    const response = await getImportRequestById(importOrderData.importRequestId);
    setImportRequestRelated(response?.content || null);
  };

  const fetchInitialData = async () => {
    const config = await getConfiguration();
    setConfiguration(config);
    const itemsResponse = await getItems();
    setItemsData(itemsResponse?.content || []);
  };

  const fetchActiveStaffs = async () => {
    if (!importOrderData?.dateReceived) return;
    const activeStaffs = await getActiveStaffsInDay({
      date: importOrderData.dateReceived,
      importOrderId: importOrderData.importOrderId,
    });
    setStaffs(activeStaffs);
  };

  const fetchInventoryItemsData = async () => {
    const detailIds = importOrderDetails.map(detail => detail.importOrderDetailId);
    if (detailIds.length === 0) {
      setInventoryItemsData([]);
      return;
    }
    const response = await getByListImportOrderDetailIds(detailIds);
    setInventoryItemsData(response?.content || []);
  };

  const fetchAssignedStaff = async () => {
    if (!importOrderData?.assignedStaffId) {
      setAssignedStaff(null);
      return;
    };
    const response = await findAccountById(importOrderData.assignedStaffId);
    setAssignedStaff(response);
  };

  // ========== USE EFFECTS ==========
  // Initialize configuration and other static data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch import order base data when ID changes
  useEffect(() => {
    if (importOrderId) {
      fetchImportOrderData();
    }
  }, [importOrderId]);

  // Fetch details when ID or pagination changes
  useEffect(() => {
    if (importOrderId) {
      fetchImportOrderDetails();
    }
  }, [importOrderId, pagination.current, pagination.pageSize]);

  // Chained data fetching based on previously fetched data
  useEffect(() => {
    fetchInventoryItemsData();
  }, [importOrderDetails]);

  useEffect(() => {
    fetchImportRequestRelated();
    fetchAssignedStaff();
  }, [importOrderData]);

  useEffect(() => {
    if (latestNotification) {
      const isImportOrderEvent = latestNotification.type === `import-order-counted-${importOrderId}`;

      if (isImportOrderEvent) {
        reloadImportOrderDetail();
      }
    }
  }, [latestNotification]);


  // ========== UTILITY FUNCTIONS ==========
  const reloadImportOrderDetail = () => {
    // close all modal and refetch all data
    setAssignModalVisible(false);
    setConfirmCountingModalVisible(false);
    setConfirmRequireCountingAgainModalVisible(false);
    setCancelImportOrderModalVisible(false);
    setExtendModalVisible(false);
    setQrModalVisible(false);
    setShowUpdateInventoryItemLocationModal(false);
    fetchImportOrderData();
    fetchImportOrderDetails();
    fetchInventoryItemsData();
    fetchAssignedStaff();
    fetchActiveStaffs();
  }


  const getRemainingAssignTime = () => {
    if (!importOrderData?.dateReceived || !importOrderData?.timeReceived || !configuration?.timeToAllowAssign) {
      return null;
    }
    const receivedDateTime = new Date(`${importOrderData.dateReceived}T${importOrderData.timeReceived}`);
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

  const canReassignStaff = () => {
    if (!importOrderData?.dateReceived || !importOrderData?.timeReceived || !configuration?.timeToAllowAssign) {
      return true;
    }

    const receivedDateTime = new Date(`${importOrderData.dateReceived}T${importOrderData.timeReceived}`);
    const now = new Date();
    const [hours, minutes, seconds] = configuration.timeToAllowAssign.split(':').map(Number);
    const allowAssignMs = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;

    return (receivedDateTime.getTime() - now.getTime()) >= allowAssignMs;
  };

  // ========== NAVIGATION HANDLERS ==========
  const handleBack = () => {
    if (importOrderData?.importRequestId) {
      navigate(ROUTES.PROTECTED.IMPORT.ORDER.LIST_FROM_REQUEST(importOrderData?.importRequestId.toString()));
    } else {
      navigate(ROUTES.PROTECTED.IMPORT.ORDER.LIST);
    }
  };

  // ========== EVENT HANDLERS ==========
  const handleTableChange = (pagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };


  // ========== ASSIGN STAFF HANDLERS ==========
  const handleOpenAssignModal = () => {
    fetchActiveStaffs();
    setAssignModalVisible(true);
  };

  const handleCloseAssignModal = () => {
    setAssignModalVisible(false);
  };

  const handleAssignStaff = async (selectedStaffId: number) => {
    if (!selectedStaffId || !importOrderId) {
      toast.warning("Vui lòng chọn nhân viên để phân công");
      return;
    }

    if (getRemainingAssignTime() === "0 tiếng 0 phút") {
      toast.error("Đã hết thời gian phân công nhân viên");
      return;
    }

    const response = await assignStaff({
      importOrderId: importOrderId,
      accountId: selectedStaffId
    });

    if (response.statusCode === 200) {
      await fetchImportOrderData(); // Re-fetch order data, which will trigger useEffect for assigned staff
      await fetchActiveStaffs(); // Re-fetch list of available staff
    } else {
      toast.error("Không thể phân công nhân viên");
    }
  };

  // ========== CANCEL ORDER HANDLERS ==========
  const handleCancelModalOk = async () => {
    if (!importOrderId) return;
    await cancelImportOrder(importOrderId);
    await fetchImportOrderData();
  };

  const handleExtendSubmit = async (extendRequest: ExtendImportOrderRequest) => {
    await extendImportOrder(extendRequest);
    await fetchImportOrderData();
  };

  // ========== UPDATE INVENTORY ITEM LOCATION HANDLERS ==========
  const handleUpdateInventoryItemLocation = async (changedInventoryItems: { inventoryItemId: string; storedLocationId: number; }[]) => {
    await updateStoredLocation(changedInventoryItems);
    await Promise.all([
      fetchImportOrderData(),
      fetchImportOrderDetails(),
      fetchInventoryItemsData(),
    ]);
  }

  const handleReadyToStoreConfirm = async () => {
    await updateImportOrderToReadyToStore(importOrderId);
    // Fetch data in parallel for better performance.
    // fetchInventoryItemsData is not needed here as it's triggered by the change in importOrderDetails from fetchImportOrderDetails.
    setShowInventoryItemsLocationConfirmModal(false);
    await Promise.all([
      fetchImportOrderData(),
      fetchImportOrderDetails(),
    ]);
  };

  const handleUpdateItemLocation = (item: ImportOrderDetailResponse) => {
    setSelectedItemForLocationUpdate(item);
    setShowUpdateInventoryItemLocationModal(true);
  };

  // Table columns definition
  const getColumns = () => {
    const baseColumns: any[] = [
    ];

    if (importRequestRelated?.importType === "RETURN") {
      baseColumns.push(
        {
          width: '25%',
          title: "Mã sản phẩm tồn kho",
          dataIndex: "inventoryItemId",
          key: "inventoryItemId",
          align: "left" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (id: number) => `#${id}`,
        },
        {
          width: '20%',
          title: "Tên sản phẩm",
          dataIndex: "itemName",
          key: "itemName",
          align: "left" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
        },
        {
          title: "Giá trị dự nhập",
          dataIndex: "expectQuantity",
          key: "expectQuantity",
          align: "center" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (expectQuantity: number, record: ImportOrderDetailResponse) => {
            const mappedItem = itemsData.find(item => item.inventoryItemIds.includes(record.inventoryItemId));
            return (
              <div>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>{expectQuantity}{" "}</span>{mappedItem?.unitType || '-'}
                <span>{" "}({record.expectMeasurementValue || 0}{" "}{mappedItem?.measurementUnit || '-'})</span>
              </div>
            );
          },
        },
        {
          title: "Thực tế đã nhập",
          dataIndex: "actualQuantity",
          key: "actualQuantity",
          align: "center" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (expectQuantity: number, record: ImportOrderDetailResponse) => {
            const mappedItem = itemsData.find(item => item.inventoryItemIds.includes(record.inventoryItemId));
            return (
              <div>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>{expectQuantity}{" "}</span>{mappedItem?.unitType || '-'}
                <span>{" "}({record.actualMeasurementValue || 0}{" "}{mappedItem?.measurementUnit || '-'})</span>
              </div>
            );
          },
        },
      )
    } else {
      baseColumns.push(
        {
          width: '15%',
          title: "Mã sản phẩm",
          dataIndex: "itemId",
          key: "itemId",
          render: (id: number) => `#${id}`,
          align: 'left' as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
        },
        {
          width: '20%',
          title: "Tên sản phẩm",
          dataIndex: "itemName",
          key: "itemName",
          ellipsis: true,
          align: 'left' as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
        },
        {
          width: '15%',
          title: "Dự nhập của đơn",
          dataIndex: "expectQuantity",
          key: "expectQuantity",
          align: 'right' as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
        },
        {
          width: '15%',
          title: "Nhập thực tế của đơn",
          dataIndex: "actualQuantity",
          key: "actualQuantity",
          align: 'right' as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
        },
      )
    }
    baseColumns.push(
      {
        width: '10%',
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status: string) => <StatusTag status={status} type="detail" />,
        align: 'center' as const,
        onHeaderCell: () => ({
          style: { textAlign: 'center' as const }
        }),
      },
      ...(importOrderData?.status === ImportStatus.COMPLETED ||
        importOrderData?.status === ImportStatus.READY_TO_STORE ||
        importOrderData?.status === ImportStatus.STORED ? [
        {
          width: '15%',
          title: "Vị trí lưu kho",
          key: "currentLocation",
          align: 'center' as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (record: ImportOrderDetailResponse) => {
            const inventoryItems = inventoryItemsData.filter(inv =>
              inv.itemId === record.itemId.toString()
            );
            const firstItem = inventoryItems[0];
            return (
              <div className="font-medium">
                {convertStoredLocationName(firstItem?.storedLocationName)}
              </div>
            );
          },
        },
        ...(importOrderData?.status === ImportStatus.COMPLETED ? [
          {
            width: '15%',
            title: "Hành động",
            key: "action",
            align: 'center' as const,
            onHeaderCell: () => ({
              style: { textAlign: 'center' as const }
            }),
            render: (record: ImportOrderDetailResponse) => {
              if (userRole !== AccountRole.WAREHOUSE_MANAGER) return null;
              return (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleUpdateItemLocation(record)}
                >
                  Cập nhật vị trí
                </Button>
              );
            },
          }
        ] : []),
      ] : [])
    )
    return baseColumns;
  };


  // Prepare data for DetailCard
  const infoItems = [
    { label: "Mã đơn nhập", value: `#${importOrderData?.importOrderId}` },
    { label: "Ngày tạo", value: importOrderData?.createdDate ? dayjs(importOrderData?.createdDate).format("DD-MM-YYYY") : "-" },
    { label: "Trạng thái", value: importOrderData?.status && <StatusTag status={importOrderData.status} type="import" /> },
    {
      label: "Thời điểm nhận dự kiến",
      value: (
        <>
          {!importOrderData?.isExtended ? (
            // Order not extended
            (userRole === AccountRole.WAREHOUSE_MANAGER &&
              importOrderData?.status !== ImportStatus.CANCELLED &&
              importOrderData?.status !== ImportStatus.COMPLETED &&
              importOrderData?.status !== ImportStatus.READY_TO_STORE &&
              importOrderData?.status !== ImportStatus.STORED &&
              importOrderData?.status !== ImportStatus.COUNTED) ? (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div> Ngày <strong>{importOrderData?.dateReceived ? dayjs(importOrderData.dateReceived).format("DD-MM-YYYY") : "-"}</strong> </div>
                  <div> Lúc {importOrderData?.timeReceived ? <strong>{importOrderData?.timeReceived?.split(':').slice(0, 2).join(':')}</strong> : "-"}</div>
                </div>
                <Button
                  className="[.ant-btn-primary]:!p-2"
                  type="primary"
                  icon={<ClockCircleOutlined />}
                  onClick={() => setExtendModalVisible(true)}
                >
                  Gia hạn
                </Button>
              </div>
            ) : (
              // Order not extended but in a final state - show info only
              <div>
                <div> Ngày <strong>{importOrderData?.dateReceived ? dayjs(importOrderData.dateReceived).format("DD-MM-YYYY") : "-"}</strong> </div>
                <div> Lúc {importOrderData?.timeReceived ? <strong>{importOrderData?.timeReceived?.split(':').slice(0, 2).join(':')}</strong> : "-"}</div>
              </div>
            )
          ) : (
            // Order extended
            (importOrderData?.status !== ImportStatus.CANCELLED &&
              importOrderData?.status !== ImportStatus.COMPLETED &&
              importOrderData?.status !== ImportStatus.READY_TO_STORE &&
              importOrderData?.status !== ImportStatus.STORED &&
              importOrderData?.status !== ImportStatus.COUNTED) ? (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-orange-600"> Ngày <strong>{importOrderData?.extendedDate ? dayjs(importOrderData.extendedDate).format("DD-MM-YYYY") : "-"}</strong> </div>
                  <div className="font-medium text-orange-600"> Lúc {importOrderData?.extendedTime ? <strong>{importOrderData?.extendedTime?.split(':').slice(0, 2).join(':')}</strong> : "-"}</div>
                </div>
                <Button
                  className="[.ant-btn-primary]:!p-2"
                  type="primary"
                  icon={<ClockCircleOutlined />}
                  disabled
                >
                  Đã gia hạn
                </Button>
              </div>
            ) : (
              // Order extended and in a final state - show info only
              <div>
                <div className="font-medium text-orange-600"> Ngày <strong>{importOrderData?.extendedDate ? dayjs(importOrderData.extendedDate).format("DD-MM-YYYY") : "-"}</strong> </div>
                <div className="font-medium text-orange-600"> Lúc {importOrderData?.extendedTime ? <strong>{importOrderData?.extendedTime?.split(':').slice(0, 2).join(':')}</strong> : "-"}</div>
              </div>
            )
          )}
        </>
      )
    },
    ...(importOrderData?.isExtended ? [
      {
        label: "Lý do gia hạn",
        value: importOrderData?.extendedReason || "-",
        span: 2
      }] : []),
    {
      label: "Thời điểm nhận thực tế",
      value: (
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-medium text-green-600"> Ngày <strong>{importOrderData?.actualDateReceived ? dayjs(importOrderData.actualDateReceived).format("DD-MM-YYYY") : "-"}</strong> </div>
            <div className="font-medium text-green-600"> Lúc {importOrderData?.actualTimeReceived ? <strong>{importOrderData?.actualTimeReceived?.split(':').slice(0, 2).join(':')}</strong> : "-"}</div>
          </div>
        </div>
      )
    },
    { label: "Phân công cho", value: assignedStaff?.fullName || "-", span: 2 },
    { label: "Ghi chú", value: importOrderData?.note || "-", span: 3 }
  ];

  // Show loading spinner when initially loading the page
  if (!importOrderData) {
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
        <h1 className="mr-4 text-xl font-bold">Chi tiết đơn nhập #{importOrderData?.importOrderId}</h1>
        {(importOrderData?.status === ImportStatus.IN_PROGRESS || importOrderData?.status === ImportStatus.EXTENDED) && (
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
            <div className="flex gap-2 ml-auto">
              {userRole === AccountRole.DEPARTMENT && (
                <>
                  <Button
                    danger
                    type="primary"
                    onClick={() => setCancelImportOrderModalVisible(true)}
                    loading={importOrderLoading}
                  >
                    Hủy đơn nhập
                  </Button>
                  <Modal
                    title="Xác nhận hủy đơn nhập"
                    open={cancelImportOrderModalVisible}
                    onOk={() => { setCancelImportOrderModalVisible(false); setCancelImportOrderResponsibilityChecked(false); handleCancelModalOk(); }}
                    onCancel={() => { setCancelImportOrderModalVisible(false); setCancelImportOrderResponsibilityChecked(false); }}
                    okText="Tôi xác nhận hủy đơn nhập"
                    cancelText="Hủy"
                    okButtonProps={{ disabled: !cancelImportOrderResponsibilityChecked }}
                    maskClosable={false}
                  >
                    <Checkbox checked={cancelImportOrderResponsibilityChecked} onChange={e => setCancelImportOrderResponsibilityChecked(e.target.checked)} style={{ marginTop: 8, fontSize: 14, fontWeight: "bold" }}>
                      Tôi xác nhận và xin chịu trách nhiệm về quyết định hủy đơn nhập này.
                    </Checkbox>
                  </Modal>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <DetailCard title="Thông tin đơn nhập" items={infoItems} />

      {userRole === AccountRole.WAREHOUSE_MANAGER && (
        <div className="flex items-center justify-end gap-4 mt-16 mb-4">
          <>
            {importOrderData?.status === ImportStatus.COMPLETED && (
              <Button
                type="primary"
                icon={<MdApartment />}
                onClick={() => setShowInventoryItemsLocationConfirmModal(true)}
              >
                Xác nhận vị trí lưu kho
              </Button>
            )}
            {(importOrderData?.status === ImportStatus.READY_TO_STORE || importOrderData?.status === ImportStatus.STORED) && (
              <Button
                type="default"
                className="!text-blue-500 !border-blue-500"
                icon={<PrinterOutlined />}
                onClick={() => setQrModalVisible(true)}
              >
                In QRCode
              </Button>
            )}
          </>

          {importOrderData?.status === ImportStatus.COUNTED && (
            <>
              <Button
                type="primary"
                loading={importOrderLoading}
                icon={<RedoOutlined />}
                onClick={() => setConfirmRequireCountingAgainModalVisible(true)}
              >
                Yêu cầu kiểm đếm lại
              </Button>
              <Button
                type="primary"
                loading={importOrderLoading}
                icon={<CheckCircleOutlined />}
                onClick={() => setConfirmCountingModalVisible(true)}
              >
                Xác nhận kiểm đếm
              </Button>
            </>
          )}
        </div>
      )}
      <Table
        columns={getColumns()}
        dataSource={importOrderDetails}
        rowKey="importOrderDetailId"
        loading={importOrderDetailLoading}
        onChange={handleTableChange}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          showTotal: (total) => `Tổng cộng ${total} sản phẩm trong đơn nhập`,
          locale: {
            items_per_page: '/ trang'
          }
        }}
      />


      {/* ----------------------------- Modals ----------------------------- */}
      {/* Modal phân công nhân viên */}
      <ImportOrderAssignStaffModal
        open={assignModalVisible}
        loading={importOrderLoading}
        accountLoading={accountLoading}
        importOrderData={importOrderData}
        assignedStaff={assignedStaff}
        staffs={staffs}
        remainingAssignTime={getRemainingAssignTime()}
        onClose={handleCloseAssignModal}
        onAssign={handleAssignStaff}
      />

      {/* Modal in QRCode */}
      <QrCodeListingModal
        open={qrModalVisible}
        loading={inventoryItemLoading}
        inventoryItems={inventoryItemsData}
        onClose={() => setQrModalVisible(false)}
      />

      {/* Modal gia hạn đơn nhập */}
      <ExtendImportOrderModal
        open={extendModalVisible}
        loading={importOrderLoading}
        importOrderData={importOrderData}
        configuration={configuration}
        onClose={() => setExtendModalVisible(false)}
        onConfirm={handleExtendSubmit}
      />

      {/* Modal cập nhật vị trí lưu kho */}
      <UpdateInventoryItemLocationModal
        loading={inventoryItemLoading}
        inventoryItems={inventoryItemsData}
        open={showUpdateInventoryItemLocationModal}
        selectedItem={selectedItemForLocationUpdate}
        onClose={() => {
          setShowUpdateInventoryItemLocationModal(false);
        }}
        onUpdateInventoryItemsLocationConfirm={handleUpdateInventoryItemLocation}
      />

      {/* Modal xác nhận vị trí lưu kho */}
      <InventoryItemLocationConfirmModal
        open={showInventoryItemsLocationConfirmModal}
        loading={importOrderLoading}
        onClose={() => setShowInventoryItemsLocationConfirmModal(false)}
        onConfirm={handleReadyToStoreConfirm}
      />

      {/* Modal xác nhận kiểm đếm */}
      <CountingConfirmModal
        open={confirmCountingModalVisible}
        loading={importOrderLoading}
        importOrderDetails={importOrderDetails}
        onClose={() => {
          setConfirmCountingModalVisible(false);
        }}
        onConfirm={async () => {
          setConfirmCountingModalVisible(false);
          if (!importOrderData?.importOrderId) return;
          if (importRequestRelated?.importType === "RETURN") {
            await completeImportOrderReturn(importOrderData.importOrderId);
          } else {
            await completeImportOrder(importOrderData.importOrderId);
          }
          await fetchImportOrderData();
          await fetchInventoryItemsData();
        }}
      />

      {/* Modal yêu cầu kiểm đếm lại */}
      <Modal
        title="Yêu cầu kiểm đếm lại"
        open={confirmRequireCountingAgainModalVisible}
        onOk={async () => {
          setConfirmRequireCountingAgainModalVisible(false);
          setConfirmRequireCountingAgainResponsibilityChecked(false);
          if (!importOrderData?.importOrderId) return;
          await countAgainImportOrder(importOrderData.importOrderId);
          await fetchImportOrderData();
          await fetchInventoryItemsData();
        }}
        onCancel={() => { setConfirmRequireCountingAgainModalVisible(false); setConfirmRequireCountingAgainResponsibilityChecked(false); }}
        okText="Xác nhận yêu cầu kiểm đếm lại"
        cancelText="Hủy"
        okButtonProps={{ disabled: !confirmRequireCountingAgainResponsibilityChecked }}
        maskClosable={false}
        width={360}
      >
        <div className="my-4">
          Thông báo cho nhân viên <b>{assignedStaff?.fullName}</b> kiểm đếm lại số lượng hàng hoá.
        </div>
        <Checkbox checked={confirmRequireCountingAgainResponsibilityChecked} onChange={e => setConfirmRequireCountingAgainResponsibilityChecked(e.target.checked)} style={{ fontSize: 14, fontWeight: "bold" }}>
          Tôi chịu trách nhiệm về quyết định này.
        </Checkbox>
      </Modal>
    </div>
  );
};

export default ImportOrderDetail; 