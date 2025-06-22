import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Card,
  Descriptions,
  Spin,
  message,
  Modal,
  Input,
  Checkbox,
  Tag,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import useExportRequestService from "@/services/useExportRequestService";
import useExportRequestDetailService from "@/services/useExportRequestDetailService";
import useItemService from "@/services/useItemService";
import { useSelector } from "react-redux";
import useConfigurationService from "@/services/useConfigurationService";
import useAccountService from "@/services/useAccountService";
import { AccountRole, ExportStatus } from "@/utils/enums";
import StatusTag from "@/components/commons/StatusTag";
import LackProductTable from "@/components/export-flow/export-detail/LackProductTable";
import UpdateExportDateTimeModal from "@/components/export-flow/export-detail/UpdateExportDateTimeModal";
import ProductDetailTable from "@/components/export-flow/export-detail/ProductDetailTable";
import ExportRequestConfirmModal from "@/components/export-flow/export-general/ExportRequestConfirmModal";
import dayjs from "dayjs";
import useDepartmentService from "@/services/useDepartmentService";
import useInventoryItemService from "@/services/useInventoryItemService";
import useProviderService from "@/services/useProviderService";

// Constants
const ITEM_STATUS_SHOW_STATUSES = [ExportStatus.COUNT_CONFIRMED];
const EXPORT_TYPE_MAP = {
  PRODUCTION: "Xuất sản xuất",
  SELLING: "Xuất bán",
  RETURN: "Xuất trả nhà cung cấp",
};

// Helper functions
const enrichWithItemMeta = (details, items) => {
  const itemMap = new Map(items.map((i) => [String(i.id), i]));
  return details.map((row) => {
    const meta = itemMap.get(String(row.itemId)) || {};
    return {
      ...row,
      totalMeasurementValue: meta.totalMeasurementValue ?? "",
      measurementUnit: meta.measurementUnit ?? "",
      itemName: meta.name ?? row.itemName ?? "",
    };
  });
};

const getMinutesFromTimeString = (timeStr) => {
  const [hours, minutes] = timeStr
    .split(" tiếng ")
    .map((part) => parseInt(part.replace(" phút", "")));
  return hours * 60 + minutes;
};

const ExportRequestDetail = () => {
  const { exportRequestId } = useParams();
  const navigate = useNavigate();
  const userRole = useSelector((state) => state.user.role);

  // Services
  const {
    getExportRequestById,
    assignCountingStaff,
    updateExportRequestStatus,
    updateExportDateTime,
    assignConfirmimgStaff,
    renewExportRequest,
    loading: exportRequestLoading,
  } = useExportRequestService();
  const { getExportRequestDetails, loading: exportRequestDetailLoading } =
    useExportRequestDetailService();
  const { getItemById, getItems } = useItemService();
  const { getConfiguration } = useConfigurationService();
  const { getActiveStaffsInDay, findAccountById } = useAccountService();
  const { getDepartmentById } = useDepartmentService();
  const { getByExportRequestDetailId, loading: inventoryLoading } =
    useInventoryItemService();
  const { loading: providerLoading, getProviderById } = useProviderService();

  // State
  const [exportRequest, setExportRequest] = useState(null);
  const [exportRequestDetails, setExportRequestDetails] = useState([]);
  const [allExportRequestDetails, setAllExportRequestDetails] = useState([]);
  const [configuration, setConfiguration] = useState(null);
  const [assignedStaff, setAssignedStaff] = useState(null);
  const [assignedKeeper, setAssignedKeeper] = useState(null);
  const [staffs, setStaffs] = useState([]);
  const [keeperStaffs, setKeeperStaffs] = useState([]);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [providerInfo, setProviderInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedExportRequestDetail, setSelectedExportRequestDetail] =
    useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [inventoryPagination, setInventoryPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal states
  const [modals, setModals] = useState({
    assign: false,
    assignKeeper: false,
    confirm: false,
    complete: false,
    updateDateTime: false,
    confirmCreateExport: false,
    cancel: false,
    detail: false,
  });

  // Form states
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedKeeperId, setSelectedKeeperId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [completeChecked, setCompleteChecked] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedDetails, setEditedDetails] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Modal helpers
  const updateModal = useCallback((modalName, value) => {
    setModals((prev) => ({ ...prev, [modalName]: value }));
  }, []);

  // Fetch functions
  const fetchExportRequestData = useCallback(async () => {
    if (!exportRequestId) return;
    const data = await getExportRequestById(exportRequestId);
    setExportRequest(data);
    return data;
  }, [exportRequestId, getExportRequestById]);

  const enrichDetails = useCallback(
    async (details) => {
      const enrichmentPromises = details.map(async (detail) => {
        try {
          const res = await getItemById(String(detail.itemId));
          const itemName = res?.content?.name || "Không xác định";
          return { ...detail, itemName };
        } catch (error) {
          console.error(`Error fetching item with id ${detail.itemId}:`, error);
          return { ...detail, itemName: "Không xác định" };
        }
      });
      return Promise.all(enrichmentPromises);
    },
    [getItemById]
  );

  const fetchDetails = useCallback(
    async (page = pagination.current, pageSize = pagination.pageSize) => {
      if (!exportRequestId) return;

      const [response, allResp] = await Promise.all([
        getExportRequestDetails(exportRequestId, page, pageSize),
        getExportRequestDetails(exportRequestId, 1, 50),
      ]);

      if (response?.content) {
        const enriched = await enrichDetails(response.content);
        setExportRequestDetails(enriched);
        const meta = response.metaDataDTO;
        setPagination({
          current: meta?.page || page,
          pageSize: meta?.limit || pageSize,
          total: meta?.total || 0,
        });
      }

      if (allResp?.content) {
        const allEnriched = await enrichDetails(allResp.content);
        setAllExportRequestDetails(allEnriched);
      }
    },
    [
      exportRequestId,
      getExportRequestDetails,
      enrichDetails,
      pagination.current,
      pagination.pageSize,
    ]
  );

  const fetchInventoryItems = useCallback(
    async (exportRequestDetailId, page = 1, pageSize = 10) => {
      try {
        const response = await getByExportRequestDetailId(
          exportRequestDetailId,
          page,
          pageSize
        );
        setInventoryItems(response.content || []);
        if (response.metaDataDTO) {
          setInventoryPagination({
            current: response.metaDataDTO.page,
            pageSize: response.metaDataDTO.limit,
            total: response.metaDataDTO.total,
          });
        }
      } catch (error) {
        setInventoryItems([]);
      }
    },
    [getByExportRequestDetailId]
  );

  const fetchActiveStaffs = useCallback(async () => {
    if (!exportRequest?.exportDate) {
      message.error("Ngày nhận hàng không hợp lệ");
      return;
    }

    try {
      setLoadingStaff(true);
      const activeStaffs = await getActiveStaffsInDay({
        date: exportRequest.exportDate,
        exportRequestId: exportRequest.exportRequestId,
      });
      setStaffs(activeStaffs);
    } catch (error) {
      message.error("Không thể tải danh sách nhân viên kho");
    } finally {
      setLoadingStaff(false);
    }
  }, [exportRequest, getActiveStaffsInDay]);

  const fetchActiveKeeperStaffs = useCallback(async () => {
    if (!exportRequest?.exportDate) {
      message.error("Ngày nhận hàng không hợp lệ");
      return;
    }
    const activeStaffs = await getActiveStaffsInDay({
      date: exportRequest.exportDate,
      exportRequestId: exportRequest.exportRequestId,
    });
    setKeeperStaffs(activeStaffs);
  }, [exportRequest, getActiveStaffsInDay]);

  const fetchAssignedCountingStaff = useCallback(async () => {
    if (!exportRequest?.countingStaffId) return;
    try {
      const response = await findAccountById(exportRequest.countingStaffId);
      setAssignedStaff(response);
    } catch (error) {
      message.error("Không thể tải thông tin nhân viên đã phân công");
    }
  }, [exportRequest?.countingStaffId, findAccountById]);

  const fetchAssignedKeeper = useCallback(async () => {
    if (!exportRequest?.assignedWareHouseKeeperId) return;
    try {
      const keeperInfo = await findAccountById(
        exportRequest.assignedWareHouseKeeperId
      );
      setAssignedKeeper(keeperInfo);
    } catch (error) {
      setAssignedKeeper(null);
    }
  }, [exportRequest?.assignedWareHouseKeeperId, findAccountById]);

  // Computed values
  const getExportTypeText = useCallback((type) => {
    return EXPORT_TYPE_MAP[type] || "";
  }, []);

  const canReassignCountingStaff = useCallback(() => {
    if (
      !exportRequest?.exportDate ||
      !exportRequest?.exportTime ||
      !configuration?.timeToAllowAssign
    ) {
      return true;
    }

    const receivedDateTime = new Date(
      `${exportRequest.exportDate}T${exportRequest.exportTime}`
    );
    const [hours, minutes, seconds] = configuration.timeToAllowAssign
      .split(":")
      .map(Number);
    const allowAssignMs = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;

    return Date.now() - receivedDateTime.getTime() <= allowAssignMs;
  }, [exportRequest, configuration]);

  const getRemainingAssignTime = useCallback(() => {
    if (
      !exportRequest?.exportDate ||
      !exportRequest?.exportTime ||
      !configuration?.timeToAllowAssign
    ) {
      return null;
    }

    const receivedDateTime = new Date(
      `${exportRequest.exportDate}T${exportRequest.exportTime}`
    );
    const [h, m, s] = configuration.timeToAllowAssign.split(":").map(Number);
    const allowAssignMs = (h * 3600 + m * 60 + s) * 1000;
    const deadline = new Date(receivedDateTime.getTime() - allowAssignMs);

    const diffMs = deadline.getTime() - Date.now();
    if (diffMs <= 0) return "0 tiếng 0 phút";

    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffMins = diffMinutes % 60;
    return `${diffHours} tiếng ${diffMins} phút`;
  }, [exportRequest, configuration]);

  const calculateRemainingTime = useCallback(
    (totalExpectedTime, defaultWorkingMinutes) => {
      try {
        const [hours, minutes] = totalExpectedTime.split(":").map(Number);
        const expectedMinutes = hours * 60 + minutes;
        const remainingMinutes = defaultWorkingMinutes - expectedMinutes;
        if (remainingMinutes <= 0) return "0 tiếng 0 phút";
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = Math.floor(remainingMinutes % 60);
        return `${remainingHours} tiếng ${remainingMins} phút`;
      } catch (error) {
        return `${Math.floor(defaultWorkingMinutes / 60)} tiếng ${
          defaultWorkingMinutes % 60
        } phút`;
      }
    },
    []
  );

  const getDefaultWorkingMinutes = useCallback(() => {
    if (!configuration) return 480;
    const [startH, startM] = configuration.workingTimeStart
      .split(":")
      .map(Number);
    const [endH, endM] = configuration.workingTimeEnd.split(":").map(Number);
    return endH * 60 + endM - (startH * 60 + startM);
  }, [configuration]);

  const getItemStatus = useCallback(() => {
    if (!allExportRequestDetails || allExportRequestDetails.length === 0)
      return null;
    const hasLack = allExportRequestDetails.some((d) => d.status === "LACK");
    return hasLack ? "LACK" : "ENOUGH";
  }, [allExportRequestDetails]);

  const getFilteredAndSortedStaffs = useMemo(() => {
    const defaultWorkingMinutes = getDefaultWorkingMinutes();
    return staffs
      .map((staff) => ({
        ...staff,
        remainingTime: calculateRemainingTime(
          staff.totalExpectedWorkingTimeOfRequestInDay || "00:00:00",
          defaultWorkingMinutes
        ),
      }))
      .filter((staff) => {
        const searchLower = searchText.toLowerCase();
        return (
          staff.fullName.toLowerCase().includes(searchLower) ||
          staff.id.toString().includes(searchLower)
        );
      })
      .sort((a, b) => {
        return (
          getMinutesFromTimeString(b.remainingTime) -
          getMinutesFromTimeString(a.remainingTime)
        );
      });
  }, [staffs, searchText, getDefaultWorkingMinutes, calculateRemainingTime]);

  // Handler functions
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleCancelCreateExport = useCallback(() => {
    setEditMode(false);
    setEditedDetails([]);
  }, []);

  const handleConfirmCreateExport = useCallback(async () => {
    const exportRequestInfo = await getExportRequestById(exportRequestId);
    if (!exportRequestInfo || !exportRequestId || editedDetails.length === 0) {
      message.error("Thiếu thông tin phiếu xuất hoặc chi tiết");
      return;
    }

    const payload = {
      exportRequestId: exportRequestId,
      items: editedDetails.map((d) => ({
        itemId: d.itemId,
        quantity: d.quantity,
        measurementValue: d.measurementValue,
      })),
    };

    try {
      await renewExportRequest(payload);
      setEditMode(false);
      setEditedDetails([]);
      message.success("Gia hạn phiếu xuất thành công");
      await fetchExportRequestData();
      fetchDetails();
    } catch (error) {
      message.error("Không thể gia hạn phiếu xuất.");
    }

    await updateExportRequestStatus(exportRequestId, ExportStatus.CANCELLED);
    message.success("Đã hủy phiếu xuất hiện tại");
    await fetchExportRequestData();
    fetchDetails();
  }, [
    exportRequestId,
    editedDetails,
    getExportRequestById,
    renewExportRequest,
    updateExportRequestStatus,
    fetchExportRequestData,
    fetchDetails,
  ]);

  const handleOpenAssignModal = useCallback(async () => {
    setSelectedStaffId(null);
    try {
      const config = await getConfiguration();
      setConfiguration(config);
    } catch (e) {
      // Handle error if needed
    }
    fetchActiveStaffs();
    updateModal("assign", true);
  }, [getConfiguration, fetchActiveStaffs, updateModal]);

  const handleConfirmComplete = useCallback(async () => {
    await updateExportRequestStatus(exportRequestId, ExportStatus.COMPLETED);
    message.success("Xác nhận hoàn thành phiếu xuất thành công");
    updateModal("complete", false);
    setCompleteChecked(false);
    await fetchExportRequestData();
    fetchDetails();
  }, [
    exportRequestId,
    updateExportRequestStatus,
    updateModal,
    fetchExportRequestData,
    fetchDetails,
  ]);

  const handleOpenAssignKeeperModal = useCallback(async () => {
    setSelectedKeeperId(null);
    await fetchActiveKeeperStaffs();
    updateModal("assignKeeper", true);
  }, [fetchActiveKeeperStaffs, updateModal]);

  const handleCloseAssignModal = useCallback(() => {
    updateModal("assign", false);
    setSelectedStaffId(null);
  }, [updateModal]);

  const handleSelectStaff = useCallback((staffId) => {
    setSelectedStaffId(staffId);
  }, []);

  const handleAssignCountingStaff = useCallback(async () => {
    if (!selectedStaffId || !exportRequestId) {
      message.warning("Vui lòng chọn nhân viên để phân công");
      return;
    }
    await assignCountingStaff(exportRequestId, selectedStaffId);
    const exportRequestResponse = await fetchExportRequestData();
    if (exportRequestResponse?.content?.countingStaffId) {
      await findAccountById(exportRequestResponse.content.countingStaffId);
    }
    await fetchActiveStaffs();
    setSelectedStaffId(null);
  }, [
    selectedStaffId,
    exportRequestId,
    assignCountingStaff,
    fetchExportRequestData,
    findAccountById,
    fetchActiveStaffs,
  ]);

  const handleSearch = useCallback((value) => {
    setSearchText(value);
  }, []);

  const handleAssignKeeper = useCallback(async () => {
    if (!selectedKeeperId || !exportRequestId) {
      message.warning("Vui lòng chọn nhân viên để phân công");
      return;
    }

    await assignConfirmimgStaff(exportRequestId, selectedKeeperId);
    await fetchExportRequestData();
    message.success("Phân công nhân viên xuất hàng thành công");
    updateModal("assignKeeper", false);
    setSelectedKeeperId(null);
  }, [
    selectedKeeperId,
    exportRequestId,
    assignConfirmimgStaff,
    fetchExportRequestData,
    updateModal,
  ]);

  const handleConfirmCounted = useCallback(async () => {
    try {
      await updateExportRequestStatus(
        exportRequestId,
        ExportStatus.COUNT_CONFIRMED
      );
      message.success("Đã xác nhận kiểm đếm");
      await fetchExportRequestData();
      fetchDetails();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái", error);
      message.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    }
  }, [
    exportRequestId,
    updateExportRequestStatus,
    fetchExportRequestData,
    fetchDetails,
  ]);

  const handleTableChange = useCallback(
    (pag) => {
      setPagination({
        ...pagination,
        current: pag.current,
        pageSize: pag.pageSize,
      });
      fetchDetails(pag.current, pag.pageSize);
    },
    [pagination, fetchDetails]
  );

  // Table columns
  const columns = useMemo(
    () =>
      [
        {
          title: "Mã sản phẩm",
          dataIndex: "itemId",
          key: "itemId",
          render: (id) => `${id}`,
        },
        {
          title: "Tên sản phẩm",
          dataIndex: "itemName",
          key: "itemName",
          ellipsis: true,
        },
        {
          title: "Số lượng cần",
          dataIndex: "quantity",
          key: "quantity",
          width: 180,
          render: (text) => <div style={{ textAlign: "right" }}>{text}</div>,
        },
        {
          title: "Số lượng đã đóng gói",
          dataIndex: "actualQuantity",
          key: "actualQuantity",
          width: 230,
          render: (text, record) => (
            <div
              style={{ textAlign: "right" }}
              className={`${
                text < record.quantity ? "text-red-600 font-semibold" : ""
              }`}
            >
              {text}
            </div>
          ),
        },
        ["PRODUCTION", "BORROWING", "LIQUIDATION"].includes(
          exportRequest?.exportType
        )
          ? {
              title: "Quy cách",
              dataIndex: "measurementValue",
              key: "measurementValue",
            }
          : null,
        {
          title: "Trạng thái",
          dataIndex: "status",
          key: "status",
          render: (status) =>
            status ? <StatusTag status={status} type="detail" /> : "-",
        },
        {
          title: "Chi tiết",
          key: "detail",
          width: 200,
          render: (text, record) => (
            <div className="flex gap-3 justify-center">
              <Tooltip title="Xem chi tiết phiếu xuất" placement="top">
                <span
                  className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer"
                  style={{ width: 32, height: 32 }}
                  onClick={() => {
                    setSelectedExportRequestDetail(record);
                    updateModal("detail", true);
                    fetchInventoryItems(record.id, 1, 10);
                  }}
                >
                  <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
                </span>
              </Tooltip>
            </div>
          ),
        },
      ].filter(Boolean),
    [exportRequest?.exportType, updateModal, fetchInventoryItems]
  );

  // Render functions
  const renderDescriptionItems = useMemo(() => {
    if (!exportRequest) return null;
    const items = [
      <Descriptions.Item label="Trạng thái phiếu" key="status">
        <StatusTag status={exportRequest.status} type="export" />
      </Descriptions.Item>,
    ];

    if (ITEM_STATUS_SHOW_STATUSES.includes(exportRequest.status)) {
      const itemStatus = getItemStatus();
      if (itemStatus === "LACK") {
        items.push(
          <Descriptions.Item label="Trạng thái hàng" key="itemStatus">
            <Tag color="error">Thiếu</Tag>
          </Descriptions.Item>
        );
      }
      if (itemStatus === "ENOUGH") {
        items.push(
          <Descriptions.Item label="Trạng thái hàng" key="itemStatus">
            <Tag color="success" style={{ fontSize: 14 }}>
              Đủ
            </Tag>
          </Descriptions.Item>
        );
      }
    }

    items.push(
      <Descriptions.Item label="Ngày tạo phiếu" key="exportDate">
        {exportRequest.createdDate
          ? dayjs(exportRequest.createdDate).format("DD-MM-YYYY")
          : "-"}
      </Descriptions.Item>,
      <Descriptions.Item label="Ngày xuất" key="exportDate">
        {exportRequest.exportDate
          ? dayjs(exportRequest.exportDate).format("DD-MM-YYYY")
          : "-"}
      </Descriptions.Item>
    );

    if (
      exportRequest.type === "PRODUCTION" ||
      exportRequest.type === "SELLING"
    ) {
      items.push(
        <Descriptions.Item label="Loại phiếu xuất" key="exportType">
          {getExportTypeText(exportRequest.type)}
        </Descriptions.Item>,
        <Descriptions.Item label="Người kiểm đếm" key="countingStaffId">
          {assignedStaff?.fullName || "-"}
        </Descriptions.Item>,
        <Descriptions.Item
          label="Người xuất hàng"
          key="assignedWareHouseKeeperId"
        >
          {assignedKeeper?.fullName || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Người nhận hàng" key="receiverName">
          {exportRequest.receiverName || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="SĐT người nhận hàng" key="receiverPhone">
          {exportRequest.receiverPhone || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Lý do xuất" key="exportReason">
          {exportRequest.exportReason || "-"}
        </Descriptions.Item>
      );
    } else if (exportRequest.type === "BORROWING") {
      if (exportRequest.receiverAddress) {
        items.push(
          <Descriptions.Item label="Loại phiếu xuất" key="exportType">
            Xuất mượn (bên ngoài)
          </Descriptions.Item>,
          <Descriptions.Item label="Tên công ty/Người mượn" key="receiverName">
            {exportRequest.receiverName || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Số điện thoại" key="receiverPhone">
            {exportRequest.receiverPhone || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Địa chỉ" key="receiverAddress">
            {exportRequest.receiverAddress || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Lý do mượn" key="exportReason">
            {exportRequest.exportReason || "-"}
          </Descriptions.Item>
        );
      } else {
        items.push(
          <Descriptions.Item label="Loại phiếu xuất" key="exportType">
            Xuất mượn (nội bộ)
          </Descriptions.Item>,
          <Descriptions.Item label="Người nhận hàng" key="receiverName">
            {exportRequest.receiverName || "-"}
          </Descriptions.Item>,
          <Descriptions.Item
            label="Số điện thoại nhận hàng"
            key="receiverPhone"
          >
            {exportRequest.receiverPhone || "-"}
          </Descriptions.Item>,
          <Descriptions.Item label="Lý do mượn" key="exportReason">
            {exportRequest.exportReason || "-"}
          </Descriptions.Item>
        );
      }
      if (exportRequest.expectedReturnDate) {
        items.push(
          <Descriptions.Item label="Ngày trả dự kiến" key="expectedReturnDate">
            {new Date(exportRequest.expectedReturnDate).toLocaleDateString(
              "vi-VN"
            )}
          </Descriptions.Item>
        );
      }
    }
    if (exportRequest.type === "RETURN") {
      items.push(
        <Descriptions.Item label="Loại phiếu xuất" key="exportType">
          {getExportTypeText(exportRequest.type)}
        </Descriptions.Item>,
        <Descriptions.Item label="Người kiểm đếm" key="countingStaffId">
          {assignedStaff?.fullName || "-"}
        </Descriptions.Item>,
        <Descriptions.Item
          label="Người xuất hàng"
          key="assignedWareHouseKeeperId"
        >
          {assignedKeeper?.fullName || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Nhà cung cấp" key="receiverName">
          {providerInfo?.name || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="SĐT Nhà cung cấp" key="receiverPhone">
          {providerInfo?.phone || "-"}
        </Descriptions.Item>,
        <Descriptions.Item label="Lý do xuất" key="exportReason">
          {exportRequest.exportReason || "-"}
        </Descriptions.Item>
      );
    }

    return items;
  }, [
    exportRequest,
    assignedStaff,
    assignedKeeper,
    providerInfo,
    getExportTypeText,
    getItemStatus,
  ]);

  // Effects
  useEffect(() => {
    fetchExportRequestData();
  }, [fetchExportRequestData]);

  useEffect(() => {
    if (exportRequest?.countingStaffId) {
      fetchAssignedCountingStaff();
    }
  }, [exportRequest?.countingStaffId, fetchAssignedCountingStaff]);

  useEffect(() => {
    fetchAssignedKeeper();
  }, [fetchAssignedKeeper]);

  useEffect(() => {
    fetchDetails();
  }, []);

  useEffect(() => {
    if (exportRequest?.type === "RETURN" && exportRequest.providerId) {
      getProviderById(exportRequest.providerId)
        .then((res) => setProviderInfo(res?.content))
        .catch(() => setProviderInfo(null));
    }
  }, [exportRequest?.type, exportRequest?.providerId, getProviderById]);

  useEffect(() => {
    if (exportRequest?.departmentId) {
      getDepartmentById(exportRequest.departmentId).then((res) => {
        setDepartmentInfo(res?.content);
      });
    }
  }, [exportRequest?.departmentId, getDepartmentById]);

  useEffect(() => {
    getItems().then((res) => setItems(res?.content || []));
  }, [getItems]);

  // Loading state
  if ((exportRequestLoading || exportRequestDetailLoading) && !exportRequest) {
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
        <h1 className="text-xl font-bold m-0 mr-10">
          Chi tiết phiếu xuất #{exportRequest?.exportRequestId}
        </h1>
        {userRole === AccountRole.WAREHOUSE_MANAGER &&
          exportRequest?.status === ExportStatus.CONFIRMED && (
            <Button
              type="primary"
              className="ml-4"
              onClick={() => updateModal("complete", true)}
            >
              Xác nhận hoàn thành
            </Button>
          )}
        {exportRequest?.status === ExportStatus.IN_PROGRESS && (
          <>
            {userRole === AccountRole.WAREHOUSE_MANAGER && (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={handleOpenAssignModal}
                disabled={!canReassignCountingStaff()}
                title={
                  !canReassignCountingStaff()
                    ? "Đã quá thời gian cho phép phân công lại"
                    : ""
                }
              >
                Phân công nhân viên kiểm đếm
              </Button>
            )}
          </>
        )}
        {userRole === AccountRole.WAREHOUSE_MANAGER &&
          exportRequest?.status === ExportStatus.WAITING_EXPORT && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              className="ml-4"
              onClick={handleOpenAssignKeeperModal}
            >
              Phân công nhân viên xuất hàng
            </Button>
          )}

        {userRole === AccountRole.DEPARTMENT &&
          exportRequest?.status === ExportStatus.COUNT_CONFIRMED && (
            <Button
              type="primary"
              className="ml-4"
              onClick={() => updateModal("updateDateTime", true)}
              disabled={getItemStatus() === "LACK"}
            >
              Cập nhật ngày khách nhận hàng
            </Button>
          )}
        {userRole === AccountRole.DEPARTMENT &&
          [
            ExportStatus.IN_PROGRESS,
            ExportStatus.COUNTED,
            ExportStatus.COUNT_CONFIRMED,
            ExportStatus.WAITING_EXPORT,
            ExportStatus.EXTENDED,
          ].includes(exportRequest?.status) && (
            <Button
              danger
              className="ml-auto"
              style={{ minWidth: 120, fontWeight: 600 }}
              loading={exportRequestLoading}
              onClick={() => updateModal("cancel", true)}
            >
              Hủy phiếu xuất
            </Button>
          )}
      </div>
      <Card className="mb-6">
        <Descriptions title="Thông tin phiếu xuất" bordered>
          {renderDescriptionItems}
        </Descriptions>
      </Card>

      <ProductDetailTable
        columns={columns}
        exportRequestDetails={editMode ? editedDetails : exportRequestDetails}
        allExportRequestDetails={allExportRequestDetails}
        detailsLoading={exportRequestDetailLoading}
        pagination={pagination}
        handleTableChange={handleTableChange}
        userRole={userRole}
        exportRequest={exportRequest}
        setConfirmModalVisible={(value) => updateModal("confirm", value)}
        editMode={editMode}
        setEditMode={setEditMode}
        editedDetails={editedDetails}
        setEditedDetails={setEditedDetails}
        creating={exportRequestDetailLoading || exportRequestLoading}
        onCancelCreateExport={handleCancelCreateExport}
        onConfirmCreateExport={() => updateModal("confirmCreateExport", true)}
      />

      {/* Modal phân công nhân viên kiểm đếm */}
      <Modal
        title={
          <div className="!bg-blue-50 -mx-6 -mt-4 px-6 py-4 border-b">
            <h3 className="text-xl font-semibold text-blue-900">
              Phân công nhân viên kho kiểm đếm
            </h3>
            <p className="text-lg text-blue-700 mt-1">
              Phiếu xuất #{exportRequest?.exportRequestId}
            </p>
            <p className="text-sm text-gray-700 mt-2 flex items-center">
              <InfoCircleOutlined className="mr-2 text-blue-500" />
              Sau {getRemainingAssignTime() || "..."}, bạn sẽ không thể phân
              công lại nhân viên
            </p>
          </div>
        }
        open={modals.assign}
        onCancel={handleCloseAssignModal}
        footer={[
          <Button key="cancel" onClick={handleCloseAssignModal}>
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAssignCountingStaff}
            disabled={!selectedStaffId}
            loading={exportRequestLoading}
          >
            Phân công
          </Button>,
        ]}
        width={700}
        className="!top-[50px]"
      >
        {loadingStaff ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="text-base font-medium text-gray-700 mb-3">
                Nhân viên đang được phân công
              </h4>
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

            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-medium text-gray-700">
                  Danh sách nhân viên có thể phân công
                </h4>
                <Input.Search
                  placeholder="Tìm theo tên hoặc mã nhân viên"
                  allowClear
                  onSearch={handleSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 300 }}
                />
              </div>
              <Table
                dataSource={getFilteredAndSortedStaffs}
                rowKey="id"
                pagination={false}
                className="!cursor-pointer [&_.ant-table-row:hover>td]:!bg-transparent"
                onRow={(record) => ({
                  onClick: () =>
                    record.id !== exportRequest?.countingStaffId &&
                    handleSelectStaff(record.id),
                  className:
                    selectedStaffId === record.id
                      ? "!bg-blue-100"
                      : record.id === exportRequest?.countingStaffId
                      ? "!opacity-50 !cursor-not-allowed"
                      : "",
                })}
                columns={[
                  {
                    title: "Mã nhân viên",
                    dataIndex: "id",
                    key: "id",
                    render: (id) => `#${id}`,
                    width: "25%",
                  },
                  {
                    title: "Họ tên",
                    dataIndex: "fullName",
                    key: "fullName",
                    width: "45%",
                  },
                  {
                    title: "Thời gian rảnh còn lại",
                    dataIndex: "remainingTime",
                    key: "remainingTime",
                    width: "30%",
                    render: (time, record) => (
                      <span
                        className={`font-medium ${
                          record.id === exportRequest?.countingStaffId
                            ? "text-gray-400"
                            : "text-blue-600"
                        }`}
                      >
                        {time || "8 tiếng 0 phút"}
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal phân công nhân viên xuất hàng */}
      <Modal
        title={
          <div className="!bg-blue-50 -mx-6 -mt-4 px-6 py-4 border-b">
            <h3 className="text-xl font-semibold text-blue-900">
              Phân công nhân viên xuất hàng
            </h3>
            <p className="text-lg text-blue-700 mt-1">
              Phiếu xuất #{exportRequest?.exportRequestId}
            </p>
          </div>
        }
        open={modals.assignKeeper}
        onCancel={() => {
          updateModal("assignKeeper", false);
          setSelectedKeeperId(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => updateModal("assignKeeper", false)}
          >
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleAssignKeeper}
            disabled={!selectedKeeperId}
            loading={exportRequestLoading}
          >
            Phân công
          </Button>,
        ]}
        width={700}
        className="!top-[50px]"
      >
        {loadingStaff ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="text-base font-medium text-gray-700 mb-3">
                Nhân viên đang được phân công xuất hàng
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Mã nhân viên</p>
                  <p className="text-base">#{assignedKeeper?.id || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Họ tên</p>
                  <p className="text-base">{assignedKeeper?.fullName || "-"}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-medium text-gray-700">
                  Danh sách nhân viên có thể phân công
                </h4>
                <Input.Search
                  placeholder="Tìm theo tên hoặc mã nhân viên"
                  allowClear
                  onSearch={handleSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 300 }}
                />
              </div>
              <Table
                dataSource={keeperStaffs.map((staff) => ({
                  ...staff,
                  remainingTime: calculateRemainingTime(
                    staff.totalExpectedWorkingTimeOfRequestInDay || "00:00:00",
                    getDefaultWorkingMinutes()
                  ),
                }))}
                rowKey="id"
                pagination={false}
                className="!cursor-pointer [&_.ant-table-row:hover>td]:!bg-transparent"
                onRow={(record) => ({
                  onClick: () => setSelectedKeeperId(record.id),
                  className:
                    selectedKeeperId === record.id ? "!bg-blue-100" : "",
                })}
                columns={[
                  {
                    title: "Mã nhân viên",
                    dataIndex: "id",
                    key: "id",
                    render: (id) => `#${id}`,
                    width: "25%",
                  },
                  {
                    title: "Họ tên",
                    dataIndex: "fullName",
                    key: "fullName",
                    width: "45%",
                  },
                  {
                    title: "Thời gian rảnh còn lại",
                    dataIndex: "remainingTime",
                    key: "remainingTime",
                    width: "30%",
                    render: (time) => (
                      <span className="font-medium text-blue-600">
                        {time || "8 tiếng 0 phút"}
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xác nhận kiểm đếm */}
      <Modal
        open={modals.confirm}
        onCancel={() => updateModal("confirm", false)}
        onOk={async () => {
          await handleConfirmCounted();
          updateModal("confirm", false);
        }}
        title={
          <span style={{ fontWeight: 700, fontSize: "18px" }}>
            Xác nhận kiểm đếm
          </span>
        }
        okText="Xác nhận"
        cancelText="Quay lại"
        width={700}
        centered
        okButtonProps={{
          disabled: !confirmChecked,
        }}
      >
        <div className="mb-4 font-semibold">
          Tổng đã kiểm đếm: {allExportRequestDetails.length} sản phẩm
        </div>

        <div className="mb-4 font-semibold">
          Tổng thiếu:{" "}
          <span className="text-red-600">
            {allExportRequestDetails.filter((d) => d.status === "LACK").length}
          </span>{" "}
          sản phẩm
        </div>

        {allExportRequestDetails.some((d) => d.status === "LACK") && (
          <>
            <div style={{ fontSize: "16px" }} className="mb-2 font-bold ">
              Danh sách sản phẩm thiếu:
            </div>
            <LackProductTable
              data={allExportRequestDetails.filter((d) => d.status === "LACK")}
            />
          </>
        )}

        <Checkbox
          className="mb-4"
          checked={confirmChecked}
          onChange={(e) => setConfirmChecked(e.target.checked)}
          style={{ fontWeight: "500" }}
        >
          Tôi đã đọc và kiểm tra kỹ các thông tin về sản phẩm đã được kiểm đếm.
        </Checkbox>
      </Modal>

      {/* Modal xác nhận hoàn thành */}
      <Modal
        open={modals.complete}
        onCancel={() => updateModal("complete", false)}
        onOk={handleConfirmComplete}
        okText="Xác nhận"
        cancelText="Quay lại"
        okButtonProps={{
          disabled: !completeChecked,
          loading: exportRequestDetailLoading,
        }}
        title={
          <span style={{ fontWeight: 700, fontSize: "18px" }}>
            Xác nhận hoàn thành phiếu xuất #{exportRequest?.exportRequestId}
          </span>
        }
        centered
      >
        <div className="flex items-start gap-3 mb-4">
          <ExclamationCircleOutlined
            style={{ fontSize: 17, color: "#ff4d4f", marginTop: 2 }}
          />
          <span style={{ color: "#ff4d4f", fontWeight: "500" }}>
            Hành động này không thể hoàn tác. Vui lòng xác nhận bạn đã xuất kho
            xong và chịu toàn bộ trách nhiệm sau khi chấp nhận.
          </span>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={completeChecked}
              onChange={(e) => setCompleteChecked(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Tôi xác nhận đã xuất kho xong, tôi xin chịu toàn bộ trách nhiệm sau
            khi chấp nhận.
          </label>
        </div>
      </Modal>

      {/* Modal hủy phiếu xuất */}
      <Modal
        open={modals.cancel}
        onCancel={() => updateModal("cancel", false)}
        onOk={async () => {
          try {
            await updateExportRequestStatus(
              exportRequestId,
              ExportStatus.CANCELLED
            );

            message.success("Đã hủy phiếu xuất thành công");
            updateModal("cancel", false);

            await fetchExportRequestData();
            await fetchDetails();
          } catch (error) {
            message.error("Không thể hủy phiếu xuất. Vui lòng thử lại.");
          }
        }}
        title={
          <span style={{ fontWeight: 700, fontSize: "18px" }}>
            Xác nhận hủy phiếu xuất
          </span>
        }
        okText="Hủy phiếu xuất"
        okType="danger"
        cancelText="Quay lại"
        centered
        confirmLoading={exportRequestLoading}
      >
        <div className="flex items-start gap-3 mb-4">
          <ExclamationCircleOutlined
            style={{ fontSize: 25, color: "#ff4d4f", marginTop: 10 }}
          />
          <div>
            <p style={{ color: "#ff4d4f", fontWeight: "bold", fontSize: 16 }}>
              Bạn chắc chắn muốn hủy phiếu xuất này?
            </p>
            <p style={{ color: "#ff4d4f", fontWeight: 400 }}>
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal cập nhật ngày giờ xuất */}
      <UpdateExportDateTimeModal
        open={modals.updateDateTime}
        onCancel={() => updateModal("updateDateTime", false)}
        exportRequest={exportRequest || {}}
        updateExportDateTime={updateExportDateTime}
        updateExportRequestStatus={updateExportRequestStatus}
        loading={exportRequestLoading}
        onSuccess={async () => {
          updateModal("updateDateTime", false);
          await fetchExportRequestData();
        }}
      />

      {/* Modal xác nhận tạo phiếu xuất */}
      <ExportRequestConfirmModal
        open={modals.confirmCreateExport}
        onOk={async () => {
          await handleConfirmCreateExport();
          updateModal("confirmCreateExport", false);
        }}
        onCancel={() => updateModal("confirmCreateExport", false)}
        confirmLoading={exportRequestLoading || exportRequestDetailLoading}
        formData={{
          exportReason: exportRequest?.exportReason,
          exportType: exportRequest?.type,
          exportDate: exportRequest?.exportDate,
          receivingDepartment: {
            name: departmentInfo?.departmentName,
          },
          receiverName: exportRequest?.receiverName,
          receiverPhone: exportRequest?.receiverPhone,
          receiverAddress: exportRequest?.receiverAddress,
          providerName: providerInfo?.name,
        }}
        details={enrichWithItemMeta(editedDetails, items)}
      />

      {/* Modal chi tiết sản phẩm tồn kho */}
      <Modal
        open={modals.detail}
        onCancel={() => updateModal("detail", false)}
        title={
          <span style={{ fontWeight: 700, fontSize: "18px" }}>
            Danh sách sản phẩm tồn kho (Mã hàng #
            {selectedExportRequestDetail?.itemId})
          </span>
        }
        footer={null}
        width={600}
      >
        <Table
          className="mt-5"
          loading={inventoryLoading}
          rowKey="id"
          dataSource={inventoryItems}
          pagination={{
            current: inventoryPagination.current,
            pageSize: inventoryPagination.pageSize,
            total: inventoryPagination.total,
            onChange: (page, pageSize) => {
              fetchInventoryItems(
                selectedExportRequestDetail.id,
                page,
                pageSize
              );
            },
            showSizeChanger: false,
          }}
          columns={[
            {
              title: "Mã sản phẩm tồn kho",
              dataIndex: "id",
              key: "id",
            },
          ]}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default ExportRequestDetail;
