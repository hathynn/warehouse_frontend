import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Spin,
  Modal,
  Input,
  Checkbox,
  DatePicker,
  TimePicker,
} from "antd";
import {
  ArrowLeftOutlined,
  UserAddOutlined,
  PrinterOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined
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
import dayjs, { Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import QRCode from 'react-qr-code';
import useInventoryItemService, { QrCodeResponse, InventoryItemResponse } from "@/services/useInventoryItemService";
dayjs.extend(duration);
import DetailCard from "@/components/commons/DetailCard";
import StatusTag from "@/components/commons/StatusTag";
import { AccountRole, ImportStatus } from "@/utils/enums";
import {
  getDefaultAssignedDateTimeForAction,
  isDateDisabledForAction,
  getDisabledTimeConfigForAction
} from "@/utils/helpers";
import { toast } from "react-toastify";

const { TextArea } = Input;

const ImportOrderDetail = () => {
  // ========== ROUTER & PARAMS ==========
  const { importOrderId } = useParams<{ importOrderId: string }>();
  const navigate = useNavigate();
  const userRole = useSelector((state: { user: UserState }) => state.user.role);

  // ========== DATA STATES ==========
  const [importOrderData, setImportOrderData] = useState<ImportOrderResponse | null>(null);
  const [importOrderDetails, setImportOrderDetails] = useState<ImportOrderDetailResponse[]>([]);
  const [staffs, setStaffs] = useState<AccountResponse[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<AccountResponse | null>(null);
  const [configuration, setConfiguration] = useState<ConfigurationDto | null>(null);
  const [qrList, setQrList] = useState<QrCodeResponse[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, { itemName: string; itemId: string }>>({});

  // ========== MODAL STATES ==========
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [confirmCountingModalVisible, setConfirmCountingModalVisible] = useState(false);
  const [cancelImportOrderModalVisible, setCancelImportOrderModalVisible] = useState(false);
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // ========== FORM & UI STATES ==========
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [confirmCountingResponsibilityChecked, setConfirmCountingResponsibilityChecked] = useState(false);
  const [cancelImportOrderResponsibilityChecked, setCancelImportOrderResponsibilityChecked] = useState(false);
  const [extendResponsibilityChecked, setExtendResponsibilityChecked] = useState(false);
  const [extendFormData, setExtendFormData] = useState<{
    extendedDate: string;
    extendedTime: string;
    extendedReason: string;
  }>({
    extendedDate: "",
    extendedTime: "",
    extendedReason: ""
  });

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
    extendImportOrder
  } = useImportOrderService();
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
    loading: configurationLoading,
    getConfiguration
  } = useConfigurationService();
  const {
    loading: inventoryItemLoading,
    getByImportOrderDetailId,
    getListQrCodes
  } = useInventoryItemService();

  // ========== COMPUTED VALUES ==========
  const loading = importOrderLoading || importOrderDetailLoading || accountLoading || configurationLoading || inventoryItemLoading;

  // ========== USE EFFECTS ==========
  // Initialize configuration on mount
  useEffect(() => {
    fetchConfiguration();
  }, []);

  // Fetch import order data when importOrderId changes
  useEffect(() => {
    if (importOrderId) {
      fetchImportOrderData();
      fetchImportOrderDetails();
    }
  }, [importOrderId]);

  // Fetch assigned staff when importOrderData changes
  useEffect(() => {
    if (importOrderData?.assignedStaffId) {
      fetchAssignedStaff();
    }
  }, [importOrderData]);

  // Handle pagination changes
  useEffect(() => {
    if (pagination.current > 0) {
      fetchImportOrderDetails();
    }
  }, [pagination.current, pagination.pageSize]);

  // ========== DATA FETCHING FUNCTIONS ==========
  const fetchConfiguration = async () => {
    const config = await getConfiguration();
    setConfiguration(config);
  };

  const fetchImportOrderData = async () => {
    if (!importOrderId) return null;

    const response = await getImportOrderById(importOrderId);
    if (response?.content) {
      setImportOrderData(response.content);
    }
    return response;
  };

  const fetchImportOrderDetails = async () => {
    if (!importOrderId) return;
    const { current, pageSize } = pagination;
    const response = await getImportOrderDetailsPaginated(
      importOrderId,
      current,
      pageSize
    );

    if (response?.content) {
      setImportOrderDetails(response.content);
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
  };

  const fetchAssignedStaff = async () => {
    if (!importOrderId) return;
    const response = await findAccountById(importOrderData?.assignedStaffId!);
    setAssignedStaff(response);
  };

  const fetchActiveStaffs = async () => {
    if (!importOrderData?.dateReceived) {
      return;
    }
    const activeStaffs = await getActiveStaffsInDay({
      date: importOrderData.dateReceived,
      importOrderId: importOrderData.importOrderId,
    });
    setStaffs(activeStaffs);
  };

  // ========== UTILITY FUNCTIONS ==========
  const calculateRemainingTime = (totalExpectedTime: string, defaultWorkingMinutes: number): string => {
    try {
      const [hours, minutes] = totalExpectedTime.split(':').map(Number);
      const expectedMinutes = (hours * 60) + minutes;
      const remainingMinutes = defaultWorkingMinutes - expectedMinutes;
      if (remainingMinutes <= 0) return "0 tiếng 0 phút";
      const remainingHours = Math.floor(remainingMinutes / 60);
      const remainingMins = Math.floor(remainingMinutes % 60);
      return `${remainingHours} tiếng ${remainingMins} phút`;
    } catch (error) {
      return `${Math.floor(defaultWorkingMinutes / 60)} tiếng ${defaultWorkingMinutes % 60} phút`;
    }
  };

  const getDefaultWorkingMinutes = () => {
    if (!configuration) return 480; // fallback
    const [startH, startM] = configuration.workingTimeStart.split(':').map(Number);
    const [endH, endM] = configuration.workingTimeEnd.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

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
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // ========== ASSIGN STAFF HANDLERS ==========
  const handleOpenAssignModal = async () => {
    setSelectedStaffId(null);
    const config = await getConfiguration();
    setConfiguration(config);
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
      toast.warning("Vui lòng chọn nhân viên để phân công");
      handleCloseAssignModal();
      return;
    }

    if (getRemainingAssignTime() === "0 tiếng 0 phút") {
      toast.error("Đã hết thời gian phân công nhân viên");
      handleCloseAssignModal();
      return;
    }

    const response = await assignStaff({
      importOrderId: importOrderId,
      accountId: selectedStaffId!
    });

    if (response.statusCode != 200) {
      toast.error("Không thể phân công nhân viên");
      handleCloseAssignModal();
      return;
    }

    const importOrderResponse = await fetchImportOrderData();
    if (importOrderResponse?.content?.assignedStaffId) {
      await findAccountById(importOrderResponse.content.assignedStaffId);
    }
    await fetchActiveStaffs();
    setSelectedStaffId(null);

  };

  // ========== CANCEL ORDER HANDLERS ==========

  const handleCancelModalOk = async () => {
    if (!importOrderId) return;
    await cancelImportOrder(importOrderId);
    await fetchImportOrderData();
  };


  // ========== EXTEND ORDER HANDLERS ==========
  const handleOpenExtendModal = () => {
    if (configuration) {
      const defaultDateTime = getDefaultAssignedDateTimeForAction("extend-import-order", configuration);
      setExtendFormData({
        extendedDate: defaultDateTime.date,
        extendedTime: defaultDateTime.time,
        extendedReason: ""
      });
    }
    setExtendModalVisible(true);
  };

  const handleCloseExtendModal = () => {
    setExtendModalVisible(false);
    setExtendResponsibilityChecked(false);
    setExtendFormData({
      extendedDate: "",
      extendedTime: "",
      extendedReason: ""
    });
  };

  const handleExtendDateChange = (date: Dayjs | null) => {
    if (!date) return;
    const newDate = date.format("YYYY-MM-DD");
    setExtendFormData(prev => ({
      ...prev,
      extendedDate: newDate
    }));
  };

  const handleExtendTimeChange = (time: Dayjs | null) => {
    if (!time) return;
    const newTime = time.format("HH:mm");
    setExtendFormData(prev => ({
      ...prev,
      extendedTime: newTime
    }));
  };

  const handleExtendSubmit = async () => {
    if (!importOrderId || !extendFormData.extendedDate || !extendFormData.extendedTime || !extendFormData.extendedReason.trim()) {
      return;
    }

    if (!extendResponsibilityChecked) {
      return;
    }

    const extendRequest: ExtendImportOrderRequest = {
      importOrderId: importOrderId,
      extendedDate: extendFormData.extendedDate,
      extendedTime: extendFormData.extendedTime,
      extendedReason: extendFormData.extendedReason
    };
    await extendImportOrder(extendRequest);
    await fetchImportOrderData();
    handleCloseExtendModal();
  };

  // ========== QR CODE HANDLERS ==========
  const handleOpenQrModal = async () => {
    setQrModalVisible(true);
    const allInventoryItemIds: string[] = [];
    const itemInfoMap: Record<string, { itemName: string; itemId: string }> = {};
    for (const detail of importOrderDetails) {
      const res = await getByImportOrderDetailId(detail.importOrderDetailId, 1, 999);
      if (res?.content) {
        for (const item of res.content) {
          allInventoryItemIds.push(item.id);
          itemInfoMap[item.id] = { itemName: item.itemName, itemId: item.itemId };
        }
      }
    }
    if (allInventoryItemIds.length === 0) {
      toast.warning("Không có sản phẩm nào để in QRCode");
      setQrList([]);
      setQrMap({});
      return;
    }
    const qrRes = await getListQrCodes(allInventoryItemIds);
    setQrList(qrRes?.content || []);
    setQrMap(itemInfoMap);
  };

  const handleCloseQrModal = () => {
    setQrModalVisible(false);
    setQrList([]);
    setQrMap({});
  };

  // ========== COMPUTED VALUES & RENDER LOGIC ==========
  const filteredAndSortedStaffs = staffs
    .map(staff => ({
      ...staff,
      remainingTime: calculateRemainingTime(
        staff.totalExpectedWorkingTimeOfRequestInDay || "00:00:00",
        getDefaultWorkingMinutes()
      )
    }))
    .filter(staff => {
      if (staff.id === importOrderData?.assignedStaffId) return false;
      const searchLower = searchText.toLowerCase();
      return (
        staff.fullName.toLowerCase().includes(searchLower) ||
        staff.id.toString().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const getMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(' tiếng ').map(part =>
          parseInt(part.replace(' phút', ''), 10)
        );
        return hours * 60 + minutes;
      };
      return getMinutes(b.remainingTime) - getMinutes(a.remainingTime);
    });

  // Table columns definition
  const columns = [
    {
      width: '15%',
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      align: 'right' as const,
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
      align: 'left' as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: '20%',
      title: "Số lượng nhập dự tính của đơn",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
      align: 'right' as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: '20%',
      title: "Số lượng nhập thực tế của đơn",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      align: 'right' as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: '15%',
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusTag status={status} type="detail" />,
      align: 'center' as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    }
  ];

  // Chuẩn bị dữ liệu cho DetailCard
  const infoItems = [
    { label: "Mã đơn nhập", value: `#${importOrderData?.importOrderId}` },
    { label: "Ngày tạo", value: importOrderData?.createdDate ? dayjs(importOrderData?.createdDate).format("DD-MM-YYYY") : "-" },
    { label: "Trạng thái", value: importOrderData?.status && <StatusTag status={importOrderData.status} type="import" /> },
    {
      label: "Thời điểm nhận dự kiến",
      value: (
        <>
          {!importOrderData?.isExtended ? (
            // Đơn chưa gia hạn
            (importOrderData?.status !== ImportStatus.CANCELLED &&
              importOrderData?.status !== ImportStatus.COMPLETED &&
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
                  onClick={handleOpenExtendModal}
                >
                  Gia hạn
                </Button>
              </div>
            ) : (
              // Đơn chưa gia hạn nhưng có trạng thái CANCELLED, COMPLETED hoặc COUNTED - chỉ hiển thị thông tin
              <div>
                <div> Ngày <strong>{importOrderData?.dateReceived ? dayjs(importOrderData.dateReceived).format("DD-MM-YYYY") : "-"}</strong> </div>
                <div> Lúc {importOrderData?.timeReceived ? <strong>{importOrderData?.timeReceived?.split(':').slice(0, 2).join(':')}</strong> : "-"}</div>
              </div>
            )
          ) : (
            // Đơn đã gia hạn
            (importOrderData?.status !== ImportStatus.CANCELLED &&
              importOrderData?.status !== ImportStatus.COMPLETED &&
              importOrderData?.status !== ImportStatus.COUNTED) ? (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-orange-600 font-medium"> Ngày <strong>{importOrderData?.extendedDate ? dayjs(importOrderData.extendedDate).format("DD-MM-YYYY") : "-"}</strong> </div>
                  <div className="text-orange-600 font-medium"> Lúc {importOrderData?.extendedTime ? <strong>{importOrderData?.extendedTime?.split(':').slice(0, 2).join(':')}</strong> : "-"}</div>
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
              // Đơn đã gia hạn nhưng có trạng thái CANCELLED, COMPLETED hoặc COUNTED - chỉ hiển thị thông tin
              <div>
                <div className="text-orange-600 font-medium"> Ngày <strong>{importOrderData?.extendedDate ? dayjs(importOrderData.extendedDate).format("DD-MM-YYYY") : "-"}</strong> </div>
                <div className="text-orange-600 font-medium"> Lúc {importOrderData?.extendedTime ? <strong>{importOrderData?.extendedTime?.split(':').slice(0, 2).join(':')}</strong> : "-"}</div>
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
            <div className="text-green-600 font-medium"> Ngày <strong>{importOrderData?.actualDateReceived ? dayjs(importOrderData.actualDateReceived).format("DD-MM-YYYY") : "-"}</strong> </div>
            <div className="text-green-600 font-medium"> Lúc {importOrderData?.actualTimeReceived ? <strong>{importOrderData?.actualTimeReceived?.split(':').slice(0, 2).join(':')}</strong> : "-"}</div>
          </div>
        </div>
      )
    },
    { label: "Phân công cho", value: assignedStaff?.fullName || "-", span: 2 },
    { label: "Ghi chú", value: importOrderData?.note || "-", span: 3 }
  ];

  // Show loading spinner when initially loading the page
  if (loading && !importOrderData) {
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
        <h1 className="text-xl font-bold mr-4">Chi tiết đơn nhập #{importOrderData?.importOrderId}</h1>
        {importOrderData?.status !== ImportStatus.CANCELLED && importOrderData?.status !== ImportStatus.COMPLETED && (
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
            <div className="ml-auto flex gap-2">
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
                    okButtonProps={{ disabled: !cancelImportOrderResponsibilityChecked, danger: true }}
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

      <div className="flex justify-end items-center mt-16 mb-4">
        {importOrderData?.status === ImportStatus.COMPLETED && (
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handleOpenQrModal}
          >
            In QRCode
          </Button>
        )}
        {importOrderData?.status === ImportStatus.COUNTED && (
          <>
            <Button
              danger
              type="primary"
              loading={importOrderLoading}
              onClick={() => setConfirmCountingModalVisible(true)}
            >
              Xác nhận kiểm đếm
            </Button>
            <Modal
              title="Xác nhận kiểm đếm"
              open={confirmCountingModalVisible}
              onOk={async () => {
                setConfirmCountingModalVisible(false);
                setConfirmCountingResponsibilityChecked(false);
                if (!importOrderData?.importOrderId) return;
                await completeImportOrder(importOrderData.importOrderId);
                await fetchImportOrderData();
              }}
              onCancel={() => { setConfirmCountingModalVisible(false); setConfirmCountingResponsibilityChecked(false); }}
              okText="Tôi xác nhận kiểm đếm"
              cancelText="Hủy"
              okButtonProps={{ disabled: !confirmCountingResponsibilityChecked, danger: true }}
              maskClosable={false}
            >
              <Checkbox checked={confirmCountingResponsibilityChecked} onChange={e => setConfirmCountingResponsibilityChecked(e.target.checked)} style={{ marginTop: 8, fontSize: 14, fontWeight: "bold" }}>
                Tôi xác nhận những thông tin trên là đúng sự thật.
              </Checkbox>
            </Modal>
          </>
        )}
      </div>

      <Table
        columns={columns}
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

      {/* Modals */}
      <Modal
        title={
          <div className="!bg-blue-50 -mx-6 -mt-6 px-6 py-4 border-b rounded-t-lg">
            <h3 className="text-xl font-semibold text-blue-900">Phân công nhân viên kho</h3>
            <p className="text-lg text-blue-700 mt-1">Đơn nhập #{importOrderData?.importOrderId}</p>
            <p className="text-sm text-gray-700 mt-2 flex items-center">
              <InfoCircleOutlined className="mr-2 text-blue-500" />
              Sau {getRemainingAssignTime() || "..."},
              bạn sẽ không thể phân công lại nhân viên
            </p>
          </div>
        }
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
            disabled={!selectedStaffId}
            loading={importOrderLoading}
          >
            Phân công
          </Button>,
        ]}
        width={700}
        className="!top-[50px]"
      >
        {accountLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Assignment Info */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="text-base font-medium text-gray-700 mb-3">Nhân viên đang được phân công</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Mã nhân viên</p>
                  <p className="text-base">#{assignedStaff?.id || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Họ tên</p>
                  <p className="text-base">{assignedStaff?.fullName || "-"}</p>
                </div>
              </div>
            </div>

            {/* Staff List */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-medium text-gray-700">Danh sách nhân viên có thể phân công</h4>
                <Input.Search
                  placeholder="Tìm theo tên hoặc mã nhân viên"
                  allowClear
                  onSearch={handleSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 300 }}
                />
              </div>
              <Table
                dataSource={filteredAndSortedStaffs}
                rowKey="id"
                pagination={false}
                className="!cursor-pointer [&_.ant-table-row:hover>td]:!bg-transparent"
                onRow={(record) => ({
                  onClick: () => handleSelectStaff(record.id),
                  className: selectedStaffId === record.id
                    ? '!bg-blue-100'
                    : ''
                })}
                columns={[
                  {
                    title: "Mã nhân viên",
                    dataIndex: "id",
                    key: "id",
                    render: (id) => `#${id}`,
                    width: '25%',
                  },
                  {
                    title: "Họ tên",
                    dataIndex: "fullName",
                    key: "fullName",
                    width: '45%',
                  },
                  {
                    title: "Thời gian rảnh còn lại",
                    dataIndex: "remainingTime",
                    key: "remainingTime",
                    width: '30%',
                    render: (time, record) => (
                      <span className={`font-medium ${record.id === importOrderData?.assignedStaffId ? 'text-gray-400' : 'text-blue-600'}`}>
                        {time || "8 tiếng 0 phút"}
                      </span>
                    )
                  }
                ]}
              />
            </div>
          </div>
        )}
      </Modal>


      <Modal
        title={<span className="text-lg font-bold">Danh sách QRCode sản phẩm</span>}
        open={qrModalVisible}
        onCancel={handleCloseQrModal}
        footer={[
          <Button key="close" onClick={handleCloseQrModal}>Đóng</Button>,
          <Button key="print" type="primary" onClick={() => window.print()} disabled={inventoryItemLoading || qrList.length === 0}>In</Button>,
        ]}
        width={900}
        className="!top-[50px] print:!block"
      >
        <div id="qr-print-area" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4 print:grid-cols-3 print:gap-4">
          {inventoryItemLoading ? (
            <div className="col-span-3 flex justify-center items-center py-8">
              <Spin size="large" />
            </div>
          ) : qrList.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500 py-8">Không có QRCode nào để in</div>
          ) : (
            qrList.map((qr) => (
              <div key={qr.id} className="border rounded-lg p-4 flex flex-col items-center bg-white print:shadow-none print:border print:p-2">
                <QRCode value={qr.id.toString()} size={128} />
                <div className="mt-2 text-base font-semibold">Mã sản phẩm: <span className="font-mono">#{qrMap[qr.id]?.itemId || '-'}</span></div>
                <div className="text-sm text-gray-700">Tên sản phẩm: {qrMap[qr.id]?.itemName || '-'}</div>
                <div className="text-xs text-gray-500 mt-1">ID QR: {qr.id}</div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Modal gia hạn đơn nhập */}
      <Modal
        title={
          <div className="!bg-blue-50 -mx-6 -mt-6 px-6 py-4 border-b rounded-t-lg">
            <h3 className="text-xl font-semibold text-blue-900">Gia hạn đơn nhập</h3>
            <p className="text-lg text-blue-700 mt-1">Đơn nhập #{importOrderData?.importOrderId}</p>
            <p className="text-sm text-gray-700 mt-2 flex items-center">
              <InfoCircleOutlined className="mr-2 text-blue-500" />
              Thời gian gia hạn phải cách thời điểm hiện tại ít nhất {configuration?.daysToAllowExtend} ngày
            </p>
          </div>
        }
        open={extendModalVisible}
        onCancel={handleCloseExtendModal}
        footer={[
          <Button key="cancel" onClick={handleCloseExtendModal}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleExtendSubmit}
            loading={importOrderLoading}
            disabled={!extendFormData.extendedDate || !extendFormData.extendedTime || !extendFormData.extendedReason.trim() || !extendResponsibilityChecked}
          >
            Xác nhận gia hạn
          </Button>,
        ]}
        width={540}
        className="!top-[50px]"
        maskClosable={false}
      >
        <div className="space-y-6 pt-4">
          {/* Thông tin hiện tại */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="text-base font-medium text-gray-700 mb-3">Thông tin hiện tại</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Ngày nhận hiện tại</p>
                <p className="text-base font-medium">
                  {importOrderData?.dateReceived ? dayjs(importOrderData.dateReceived).format("DD-MM-YYYY") : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Giờ nhận hiện tại</p>
                <p className="text-base font-medium">
                  {importOrderData?.timeReceived?.split(':').slice(0, 2).join(':') || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Form gia hạn */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 text-sm font-medium text-gray-700">
                Ngày nhận mới <span className="text-red-500">*</span>
              </label>
              <DatePicker
                className="w-full"
                format="DD-MM-YYYY"
                value={extendFormData.extendedDate ? dayjs(extendFormData.extendedDate) : null}
                onChange={handleExtendDateChange}
                disabledDate={(current) => isDateDisabledForAction(current, "extend-import-order", configuration)}
                showNow={false}
                placeholder="Chọn ngày nhận mới"
              />
            </div>

            <div>
              <label className="mb-2 text-sm font-medium text-gray-700">
                Giờ nhận mới <span className="text-red-500">*</span>
              </label>
              <TimePicker
                className="w-full"
                value={extendFormData.extendedTime ? dayjs(`1970-01-01 ${extendFormData.extendedTime}`) : null}
                onChange={handleExtendTimeChange}
                format="HH:mm"
                showNow={false}
                needConfirm={false}
                placeholder="Chọn giờ nhận mới"
                disabledTime={() => getDisabledTimeConfigForAction(extendFormData.extendedDate, "extend-import-order", configuration)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Lý do gia hạn <span className="text-red-500">*</span>
              </label>
              <TextArea
                className="!mb-2"
                rows={4}
                placeholder="Nhập lý do gia hạn đơn nhập..."
                value={extendFormData.extendedReason}
                onChange={(e) => setExtendFormData(prev => ({
                  ...prev,
                  extendedReason: e.target.value.slice(0, 200)
                }))}
                maxLength={200}
                showCount
              />
            </div>
          </div>

          <Checkbox
            checked={extendResponsibilityChecked}
            onChange={e => setExtendResponsibilityChecked(e.target.checked)}
            style={{ fontSize: 14, fontWeight: "bold" }}
          >
            Tôi xác nhận đã điền đúng thông tin và đồng ý gia hạn.
          </Checkbox>
        </div>
      </Modal>
    </div>
  );
};

export default ImportOrderDetail; 