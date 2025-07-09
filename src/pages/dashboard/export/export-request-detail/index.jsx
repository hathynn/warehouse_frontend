import React, { useState, useEffect, useCallback } from "react";
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
import UpdateExportDateTimeModal from "@/components/export-flow/export-detail/UpdateExportDateTimeModal";
import ProductDetailTable from "@/components/export-flow/export-detail/ProductDetailTable";
import ExportRequestConfirmModal from "@/components/export-flow/export-general/ExportRequestConfirmModal";
import dayjs from "dayjs";
import useDepartmentService from "@/services/useDepartmentService";
import useInventoryItemService from "@/services/useInventoryItemService";
import useProviderService from "@/services/useProviderService";
import { SwapOutlined } from "@ant-design/icons";

function enrichWithItemMeta(details, items) {
  return details.map((row) => {
    const meta = items.find((i) => String(i.id) === String(row.itemId)) || {};
    return {
      ...row,
      totalMeasurementValue: meta.totalMeasurementValue ?? "",
      measurementUnit: meta.measurementUnit ?? "",
      itemName: meta.name ?? row.itemName ?? "",
    };
  });
}

const ExportRequestDetail = () => {
  const { exportRequestId } = useParams();
  const [configuration, setConfiguration] = useState(null);
  const navigate = useNavigate();
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
  const [exportRequest, setExportRequest] = useState(null);
  const [exportRequestDetails, setExportRequestDetails] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const { getConfiguration } = useConfigurationService();
  const [loadingStaff, setLoadingStaff] = useState(false);
  const { getActiveStaffsInDay, findAccountById } = useAccountService();
  const [staffs, setStaffs] = useState([]);
  const [assignedStaff, setAssignedStaff] = useState(null);
  const [searchText, setSearchText] = useState("");
  const userRole = useSelector((state) => state.user.role);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [updateDateTimeModalOpen, setUpdateDateTimeModalOpen] = useState(false);
  const [assignKeeperModalVisible, setAssignKeeperModalVisible] =
    useState(false);
  const [selectedKeeperId, setSelectedKeeperId] = useState(null);
  const [assignedKeeper, setAssignedKeeper] = useState(null);
  const [keeperStaffs, setKeeperStaffs] = useState([]);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completeChecked, setCompleteChecked] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false); // đặt bên ngoài modal
  const [editMode, setEditMode] = useState(false);
  const [editedDetails, setEditedDetails] = useState([]); // clone chi tiết khi edit
  const [confirmCreateExportModalVisible, setConfirmCreateExportModalVisible] =
    useState(false);
  const [allExportRequestDetails, setAllExportRequestDetails] = useState([]);
  const { getDepartmentById } = useDepartmentService();
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const { getItems } = useItemService();
  const [items, setItems] = useState([]);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [modalPagination, setModalPagination] = useState({
    current: 1,
    pageSize: 10, // Set cứng là 10
    total: 0,
  });
  const [recountModalVisible, setRecountModalVisible] = useState(false);
  const [viewedPages, setViewedPages] = useState(new Set([1])); // Track các trang đã xem
  const [selectedExportRequestDetail, setSelectedExportRequestDetail] =
    useState(null);
  const { getByExportRequestDetailId, loading: inventoryLoading } =
    useInventoryItemService();
  const [inventorySearchText, setInventorySearchText] = useState("");
  const [providerInfo, setProviderInfo] = useState(null);
  const { loading: providerLoading, getProviderById } = useProviderService();
  const [itemsLoading, setItemsLoading] = useState(true);
  const [expandedModal, setExpandedModal] = useState(false);
  const [availableInventoryItems, setAvailableInventoryItems] = useState([]);
  const [selectedNewItem, setSelectedNewItem] = useState(null);
  const [selectedOldItem, setSelectedOldItem] = useState(null);
  const [confirmSwapModalVisible, setConfirmSwapModalVisible] = useState(false);
  const [availableItemsLoading, setAvailableItemsLoading] = useState(false);
  const { getAllInventoryItems, changeInventoryItemExportDetail } =
    useInventoryItemService();

  // Hàm lấy thông tin phiếu xuất
  const fetchExportRequestData = useCallback(async () => {
    if (!exportRequestId) return;
    const data = await getExportRequestById(exportRequestId);
    setExportRequest(data);
  }, [exportRequestId, getExportRequestById]);

  // ✅ GIẢI PHÁP TỐI ÂU: Sử dụng items đã có sẵn thay vì gọi API
  const enrichDetailsWithLocalData = (details, itemsData) => {
    return details.map((detail) => {
      const itemInfo = itemsData.find(
        (item) => String(item.id) === String(detail.itemId)
      );
      return {
        ...detail,
        itemName: itemInfo?.name || detail.itemName || "Không xác định",
      };
    });
  };

  const fetchDetails = useCallback(
    async (page = pagination.current, pageSize = pagination.pageSize) => {
      if (!exportRequestId || items.length === 0) return;

      try {
        // Lấy dữ liệu phân trang
        const response = await getExportRequestDetails(
          exportRequestId,
          page,
          pageSize
        );

        if (response && response.content) {
          const enriched = enrichDetailsWithLocalData(response.content, items);
          setExportRequestDetails(enriched);

          const meta = response.metaDataDTO;
          setPagination((prev) => ({
            current: meta ? meta.page : page,
            pageSize: meta ? meta.limit : pageSize,
            total: meta ? meta.total : 0,
          }));
        }

        // ✅ Chỉ fetch all data một lần khi chưa có
        if (allExportRequestDetails.length === 0 && page === 1) {
          const allResp = await getExportRequestDetails(
            exportRequestId,
            1,
            1000
          );
          if (allResp && allResp.content) {
            const allEnriched = enrichDetailsWithLocalData(
              allResp.content,
              items
            );
            setAllExportRequestDetails(allEnriched);
          }
        }
      } catch (error) {
        console.error("Error fetching export request details:", error);
        message.error("Không thể tải chi tiết phiếu xuất");
      }
    },
    [exportRequestId, items, allExportRequestDetails.length]
  );

  const fetchInventoryItems = async (exportRequestDetailId) => {
    try {
      setInventorySearchText("");
      const response = await getByExportRequestDetailId(
        exportRequestDetailId,
        1,
        1000
      );
      setInventoryItems(response.content || []);
    } catch (error) {
      setInventoryItems([]);
    }
  };

  const fetchAvailableInventoryItems = async (itemId) => {
    try {
      setAvailableItemsLoading(true);
      const response = await getAllInventoryItems(1, 100000);

      // Filter items với itemId trùng và status AVAILABLE
      const filtered = (response.content || []).filter(
        (item) => item.itemId === itemId && item.status === "AVAILABLE"
      );

      setAvailableInventoryItems(filtered);
    } catch (error) {
      console.error("Error fetching available items:", error);
      setAvailableInventoryItems([]);
    } finally {
      setAvailableItemsLoading(false);
    }
  };

  const fetchActiveStaffs = async () => {
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
      console.error("Failed to fetch warehouse keepers:", error);
      message.error("Không thể tải danh sách nhân viên kho");
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchActiveKeeperStaffs = async () => {
    if (!exportRequest?.exportDate) {
      message.error("Ngày nhận hàng không hợp lệ");
      return;
    }
    const activeStaffs = await getActiveStaffsInDay({
      date: exportRequest.exportDate,
      exportRequestId: exportRequest.exportRequestId,
    });
    setKeeperStaffs(activeStaffs);
  };

  const fetchAssignedCountingStaff = useCallback(async () => {
    if (!exportRequestId) return;
    try {
      const response = await findAccountById(exportRequest?.countingStaffId);
      setAssignedStaff(response);
    } catch (error) {
      console.error("Failed to fetch assigned staff:", error);
      message.error("Không thể tải thông tin nhân viên đã phân công");
    }
  }, [exportRequestId, findAccountById]);

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

  useEffect(() => {
    fetchExportRequestData();
  }, []);

  useEffect(() => {
    if (exportRequest?.countingStaffId) {
      fetchAssignedCountingStaff();
    }
  }, [exportRequest]);

  useEffect(() => {
    fetchAssignedKeeper();
  }, [exportRequest?.assignedWareHouseKeeperId]);

  useEffect(() => {
    if (items.length > 0 && exportRequestId) {
      fetchDetails(1, pagination.pageSize); // Reset về trang 1
    }
  }, [items, exportRequestId, fetchDetails]);

  useEffect(() => {
    // Nếu có exportRequest.type === "RETURN" và có providerId thì mới lấy
    if (exportRequest?.type === "RETURN" && exportRequest.providerId) {
      getProviderById(exportRequest.providerId)
        .then((res) => setProviderInfo(res?.content))
        .catch(() => setProviderInfo(null));
    }
  }, [exportRequest]);

  // Khi đã có exportRequest
  useEffect(() => {
    if (exportRequest?.departmentId) {
      getDepartmentById(exportRequest.departmentId).then((res) => {
        setDepartmentInfo(res?.content);
      });
    }
  }, [exportRequest?.departmentId]);

  useEffect(() => {
    const loadItems = async () => {
      setItemsLoading(true);
      try {
        const res = await getItems();
        setItems(res?.content || []);
      } catch (error) {
        console.error("Error loading items:", error);
        setItems([]);
      } finally {
        setItemsLoading(false);
      }
    };

    loadItems();
  }, []);

  useEffect(() => {
    if (allExportRequestDetails.length > 0 && items.length > 0) {
      const enriched = enrichDetailsWithLocalData(
        allExportRequestDetails,
        items
      );

      // Chỉ update nếu thực sự có thay đổi về itemName
      const hasChanges = enriched.some(
        (item, index) =>
          item.itemName !== allExportRequestDetails[index]?.itemName
      );

      if (hasChanges) {
        setAllExportRequestDetails(enriched);
      }
    }
  }, [items]);

  // Huỷ tạo phiếu
  const handleCancelCreateExport = () => {
    setEditMode(false);
    setEditedDetails([]);
  };

  const handleSwapItem = async () => {
    try {
      await changeInventoryItemExportDetail({
        oldInventoryItemId: selectedOldItem.id,
        newInventoryItemId: selectedNewItem.id,
      });

      // Refresh data
      await fetchInventoryItems(selectedExportRequestDetail.id);
      setConfirmSwapModalVisible(false);
      setSelectedOldItem(null);
      setSelectedNewItem(null);
      setExpandedModal(false);
    } catch (error) {
      console.error("Error swapping items:", error);
    }
  };

  // Function filter inventory items theo search text
  const getFilteredInventoryItems = () => {
    if (!inventorySearchText.trim()) {
      return inventoryItems;
    }
    return inventoryItems.filter((item) =>
      item.id
        .toString()
        .toLowerCase()
        .includes(inventorySearchText.toLowerCase())
    );
  };

  // Xác nhận tạo phiếu xuất mới (có gọi cả API chi tiết)
  const handleConfirmCreateExport = async () => {
    // Lấy info phiếu xuất gốc
    const exportRequestInfo = await getExportRequestById(exportRequestId);
    if (!exportRequestInfo || !exportRequestId || editedDetails.length === 0) {
      message.error("Thiếu thông tin phiếu xuất hoặc chi tiết");
      return;
    }

    // Chuẩn bị payload đúng như API yêu cầu
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

      // Có thể gọi lại fetch data nếu muốn
      await fetchExportRequestData();
      fetchDetails();
    } catch (error) {
      message.error("Không thể gia hạn phiếu xuất.");
    }
    //luồng hủy
    await updateExportRequestStatus(exportRequestId, ExportStatus.CANCELLED);
    message.success("Đã hủy phiếu xuất hiện tại");
    await fetchExportRequestData();
    fetchDetails();
  };

  const handleOpenAssignModal = async () => {
    setSelectedStaffId(null);
    // Lấy configuration
    try {
      const config = await getConfiguration();
      setConfiguration(config);
    } catch (e) {
      // Có thể toast lỗi ở đây nếu muốn
    }
    fetchActiveStaffs();
    setAssignModalVisible(true);
  };

  const handleConfirmComplete = async () => {
    await updateExportRequestStatus(exportRequestId, ExportStatus.COMPLETED);
    message.success("Xác nhận hoàn thành phiếu xuất thành công");
    setCompleteModalVisible(false);
    setCompleteChecked(false);
    await fetchExportRequestData();
    fetchDetails();
  };

  const handleOpenAssignKeeperModal = async () => {
    setSelectedKeeperId(null);
    await fetchActiveKeeperStaffs();
    setAssignKeeperModalVisible(true);
  };

  const handleCloseAssignModal = () => {
    setAssignModalVisible(false);
    setSelectedStaffId(null);
  };

  const handleSelectStaff = (staffId) => {
    setSelectedStaffId(staffId);
  };

  const handleAssignCountingStaff = async () => {
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
  };

  const getExportTypeText = (type) => {
    if (type === "PRODUCTION") return "Xuất sản xuất";
    else if (type === "SELLING") return "Xuất bán";
    else if (type === "RETURN") return "Xuất trả nhà cung cấp";
    return "";
  };

  // Add new function to check if reassignment is allowed
  const canReassignCountingStaff = () => {
    if (
      !exportRequest?.exportDate ||
      !exportRequest?.exportTime ||
      !configuration?.timeToAllowAssign
    ) {
      return true;
    }

    // Combine dateReceived and timeReceived into a Date object
    const receivedDateTime = new Date(
      `${exportRequest.exportDate}T${exportRequest.exportTime}`
    );
    const now = new Date();
    // Convert timeToAllowAssign to milliseconds
    const [hours, minutes, seconds] = configuration.timeToAllowAssign
      .split(":")
      .map(Number);
    const allowAssignMs = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;

    // If current time - received time < timeToAllowAssign, don't allow reassignment
    return Date.now() - receivedDateTime.getTime() <= allowAssignMs;
  };

  const getRemainingAssignTime = () => {
    if (
      !exportRequest?.exportDate ||
      !exportRequest?.exportTime ||
      !configuration?.timeToAllowAssign
    ) {
      return null;
    }

    // 1. Thời điểm nhận hàng
    const receivedDateTime = new Date(
      `${exportRequest.exportDate}T${exportRequest.exportTime}`
    );

    // 2. Hạn chót = nhận hàng + timeToAllowAssign
    const [h, m, s] = configuration.timeToAllowAssign.split(":").map(Number);
    const allowAssignMs = (h * 3600 + m * 60 + s) * 1000;
    const deadline = new Date(receivedDateTime.getTime() - allowAssignMs); //  **+**  ở đây

    // 3. Còn lại bao lâu
    const diffMs = deadline.getTime() - Date.now();
    if (diffMs <= 0) return "0 tiếng 0 phút"; // đã quá hạn

    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffMins = diffMinutes % 60;
    return `${diffHours} tiếng ${diffMins} phút`;
  };

  const calculateRemainingTime = (totalExpectedTime, defaultWorkingMinutes) => {
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
  };

  const getDefaultWorkingMinutes = () => {
    if (!configuration) return 480; // fallback
    const [startH, startM] = configuration.workingTimeStart
      .split(":")
      .map(Number);
    const [endH, endM] = configuration.workingTimeEnd.split(":").map(Number);
    return endH * 60 + endM - (startH * 60 + startM);
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleAssignKeeper = async () => {
    if (!selectedKeeperId || !exportRequestId) {
      message.warning("Vui lòng chọn nhân viên để phân công");
      return;
    }

    await assignConfirmimgStaff(exportRequestId, selectedKeeperId);
    await fetchExportRequestData();
    message.success("Phân công nhân viên xuất hàng thành công");
    setAssignKeeperModalVisible(false);
    setSelectedKeeperId(null);
  };

  const getFilteredAndSortedStaffs = () => {
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
        // Convert remaining time to minutes for comparison
        const getMinutes = (timeStr) => {
          const [hours, minutes] = timeStr
            .split(" tiếng ")
            .map((part) => parseInt(part.replace(" phút", "")));
          return hours * 60 + minutes;
        };

        return getMinutes(b.remainingTime) - getMinutes(a.remainingTime);
      });
  };

  const ITEM_STATUS_SHOW_STATUSES = [ExportStatus.COUNT_CONFIRMED];

  const getItemStatus = () => {
    if (!allExportRequestDetails || allExportRequestDetails.length === 0)
      return null;
    const hasLack = allExportRequestDetails.some((d) => d.status === "LACK");
    return hasLack ? "LACK" : "ENOUGH";
  };

  const renderDescriptionItems = () => {
    if (!exportRequest) return null;
    const items = [
      <Descriptions.Item label="Trạng thái phiếu" key="status">
        <StatusTag status={exportRequest.status} type="export" />
      </Descriptions.Item>,
    ];
    //Hiển thị Trạng thái hàng với Tag của Ant Design
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
  };

  const handleConfirmCounted = async () => {
    try {
      await updateExportRequestStatus(
        exportRequestId,
        ExportStatus.COUNT_CONFIRMED
      );
      message.success("Đã xác nhận kiểm đếm");

      // Gọi lại dữ liệu để cập nhật giao diện
      await fetchExportRequestData();
      fetchDetails();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái", error);
      message.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    }
  };

  const columns = [
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
      width: 200,
      render: (text, record) => {
        // ✅ THÊM: Information hiding cho DEPARTMENT ở IN_PROGRESS và COUNTED
        if (
          userRole === AccountRole.DEPARTMENT &&
          [ExportStatus.IN_PROGRESS, ExportStatus.COUNTED].includes(
            exportRequest?.status
          )
        ) {
          return <div style={{ textAlign: "right" }}>0</div>;
        }

        return (
          <div
            style={{ textAlign: "right" }}
            className={`${
              text < record.quantity ? "text-red-600 font-semibold" : ""
            }`}
          >
            {text}
          </div>
        );
      },
    },
    // Điều kiện column Quy cách
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
      width: 200,
      render: (status) => {
        if (
          userRole === AccountRole.DEPARTMENT &&
          [ExportStatus.IN_PROGRESS, ExportStatus.COUNTED].includes(
            exportRequest?.status
          )
        ) {
          return "-";
        }

        return status ? <StatusTag status={status} type="detail" /> : "-";
      },
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
                setDetailModalVisible(true);
                fetchInventoryItems(record.id);
              }}
            >
              <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
            </span>
          </Tooltip>
        </div>
      ),
    },
  ].filter((column) => {
    if (
      column?.key === "detail" &&
      exportRequest?.status === ExportStatus.CANCELLED
    ) {
      return false;
    }
    return Boolean(column);
  });

  const handleBack = () => {
    navigate(-1);
  };

  const getSortedProducts = () => {
    // Tách riêng items LACK và ENOUGH
    const lackItems = allExportRequestDetails.filter(
      (item) => item.status === "LACK"
    );
    const enoughItems = allExportRequestDetails.filter(
      (item) => item.status !== "LACK"
    );

    return [...lackItems, ...enoughItems];
  };

  // Thêm function để lấy data đã sort cho bảng chính
  const getSortedProductsForMainTable = () => {
    const sortedData = getSortedProducts(); // Dùng lại function sort đã có
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return sortedData.slice(startIndex, endIndex);
  };

  // Thêm handler mới cho bảng chính
  const handleMainTableChange = (pag) => {
    setPagination({
      ...pagination,
      current: pag.current,
      pageSize: pag.pageSize,
      total: allExportRequestDetails.length,
    });
  };

  // Function kiểm tra đã xem hết tất cả trang chưa
  const hasViewedAllPages = () => {
    const totalPages = Math.ceil(
      allExportRequestDetails.length / modalPagination.pageSize
    );
    return totalPages <= 1 || viewedPages.size >= totalPages;
  };

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
              onClick={() => setCompleteModalVisible(true)}
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

        {/* Nút cập nhật ngày khách nhận hàng */}
        {userRole === AccountRole.DEPARTMENT &&
          exportRequest?.status === ExportStatus.COUNT_CONFIRMED && (
            <Button
              type="primary"
              className="ml-4"
              onClick={() => setUpdateDateTimeModalOpen(true)}
              disabled={getItemStatus() === "LACK"} // Disable nếu thiếu hàng
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
              onClick={() => setCancelModalVisible(true)}
            >
              Hủy phiếu xuất
            </Button>
          )}
      </div>
      <Card className="mb-6">
        <Descriptions title="Thông tin phiếu xuất" bordered>
          {renderDescriptionItems()}
        </Descriptions>
      </Card>
      {}
      <ProductDetailTable
        columns={columns}
        exportRequestDetails={
          editMode ? editedDetails : getSortedProductsForMainTable()
        }
        allExportRequestDetails={allExportRequestDetails}
        detailsLoading={exportRequestDetailLoading}
        pagination={{
          ...pagination,
          total: allExportRequestDetails.length,
        }}
        handleTableChange={handleMainTableChange}
        userRole={userRole}
        exportRequest={exportRequest}
        setConfirmModalVisible={setConfirmModalVisible}
        editMode={editMode}
        setEditMode={setEditMode}
        editedDetails={editedDetails}
        setEditedDetails={setEditedDetails}
        creating={exportRequestDetailLoading || exportRequestLoading}
        onCancelCreateExport={handleCancelCreateExport}
        onConfirmCreateExport={() => setConfirmCreateExportModalVisible(true)}
        setRecountModalVisible={setRecountModalVisible}
        recountModalVisible={recountModalVisible}
      />
      {/* Modal chọn Warehouse Keeper */}
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
        open={assignModalVisible}
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
            {/* Current Assignment Info */}
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

            {/* Staff List */}
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
                dataSource={getFilteredAndSortedStaffs()}
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
        open={assignKeeperModalVisible}
        onCancel={() => {
          setAssignKeeperModalVisible(false);
          setSelectedKeeperId(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => setAssignKeeperModalVisible(false)}
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
            {/* Current Assignment Info */}
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

            {/* Staff List */}
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
      <Modal
        open={confirmModalVisible}
        onCancel={() => {
          setConfirmModalVisible(false);
          // Reset state khi đóng modal
          setModalPagination({ current: 1, pageSize: 10, total: 0 });
          setViewedPages(new Set([1]));
          setConfirmChecked(false);
        }}
        onOk={async () => {
          await handleConfirmCounted();
          setConfirmModalVisible(false);
          // Reset state sau khi confirm
          setModalPagination({ current: 1, pageSize: 10, total: 0 });
          setViewedPages(new Set([1]));
          setConfirmChecked(false);
        }}
        title={
          <span style={{ fontWeight: 700, fontSize: "18px" }}>
            Xác nhận kiểm đếm
          </span>
        }
        okText="Xác nhận"
        cancelText="Quay lại"
        width={800}
        centered
        okButtonProps={{
          disabled: !confirmChecked || !hasViewedAllPages(),
        }}
      >
        <div className="mb-1 font-semibold">
          Tổng đã đóng gói: {allExportRequestDetails.length} sản phẩm
        </div>

        <div className="mb-4 font-semibold">
          Tổng thiếu:{" "}
          <span className="text-red-600">
            {allExportRequestDetails.filter((d) => d.status === "LACK").length}
          </span>{" "}
          sản phẩm
        </div>

        <div style={{ fontSize: "16px" }} className="mb-2 font-bold">
          Danh sách tất cả sản phẩm:
        </div>

        <Table
          dataSource={getSortedProducts()}
          rowKey="id"
          style={{ height: "500px", overflowY: "auto" }}
          pagination={
            allExportRequestDetails.length > 10
              ? {
                  current: modalPagination.current,
                  pageSize: modalPagination.pageSize,
                  total: allExportRequestDetails.length,
                  onChange: (page) => {
                    setModalPagination({
                      current: page,
                      pageSize: 10,
                      total: allExportRequestDetails.length,
                    });
                    // Thêm trang hiện tại vào danh sách đã xem
                    setViewedPages((prev) => new Set([...prev, page]));
                  },
                  showSizeChanger: false,
                  showQuickJumper: false,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} sản phẩm`,
                }
              : false // Ẩn pagination nếu <= 10 items
          }
          size="small"
          className="mb-4"
          columns={[
            {
              title: "Mã sản phẩm",
              dataIndex: "itemId",
              key: "itemId",
              width: 120,
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
              width: 120,
              align: "right",
            },
            {
              title: "Số lượng thực tế",
              dataIndex: "actualQuantity",
              key: "actualQuantity",
              width: 140,
              align: "right",
              render: (text, record) => (
                <span
                  className={
                    text < record.quantity ? "text-red-600 font-semibold" : ""
                  }
                >
                  {text}
                </span>
              ),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              key: "status",
              width: 100,
              render: (status) => (
                <Tag color={status === "LACK" ? "error" : "success"}>
                  {status === "LACK" ? "Thiếu" : "Đủ"}
                </Tag>
              ),
            },
          ]}
          rowClassName={(record) =>
            record.status === "LACK" ? "bg-red-50" : ""
          }
        />

        {/* Hiển thị thông báo nếu chưa xem hết tất cả trang */}
        {!hasViewedAllPages() && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <span className="text-yellow-800 text-sm">
              ⚠️ Bạn cần xem qua tất cả các trang trước khi có thể xác nhận kiểm
              đếm.
            </span>
          </div>
        )}

        <Checkbox
          className="mb-4"
          checked={confirmChecked}
          onChange={(e) => setConfirmChecked(e.target.checked)}
          style={{ fontWeight: "500" }}
          disabled={!hasViewedAllPages()}
        >
          Tôi đã đọc và kiểm tra kỹ các thông tin về sản phẩm đã được kiểm đếm.
        </Checkbox>
      </Modal>

      <Modal
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
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
      <Modal
        open={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        onOk={async () => {
          try {
            await updateExportRequestStatus(
              exportRequestId,
              ExportStatus.CANCELLED
            );

            message.success("Đã hủy phiếu xuất thành công");
            setCancelModalVisible(false);

            // Refresh data
            await fetchExportRequestData();
            await fetchDetails();
          } catch (error) {
            console.error("Error cancelling export request:", error);
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
      <UpdateExportDateTimeModal
        open={updateDateTimeModalOpen}
        onCancel={() => setUpdateDateTimeModalOpen(false)}
        exportRequest={exportRequest || {}}
        updateExportDateTime={updateExportDateTime}
        updateExportRequestStatus={updateExportRequestStatus}
        loading={exportRequestLoading}
        onSuccess={async () => {
          setUpdateDateTimeModalOpen(false);
          await fetchExportRequestData();
        }}
      />
      <ExportRequestConfirmModal
        open={confirmCreateExportModalVisible}
        onOk={async () => {
          await handleConfirmCreateExport();
          setConfirmCreateExportModalVisible(false);
        }}
        onCancel={() => setConfirmCreateExportModalVisible(false)}
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
        items={items}
        // details={editedDetails}
      />
      <Modal
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setInventorySearchText("");
          setExpandedModal(false);
          setSelectedOldItem(null);
          setSelectedNewItem(null);
        }}
        title={
          <span style={{ fontWeight: 700, fontSize: "18px" }}>
            Danh sách sản phẩm tồn kho (Mã hàng #
            {selectedExportRequestDetail?.itemId})
          </span>
        }
        footer={null}
        width={expandedModal ? 1200 : 600}
        style={{ transition: "all 0.3s ease" }}
      >
        <div style={{ display: "flex", gap: "20px" }}>
          {/* Phần bên trái - Danh sách hiện tại */}
          <div
            style={{
              flex: expandedModal ? "0 0 48%" : "1",
              transition: "all 0.3s ease",
            }}
          >
            <div className="mb-4">
              <Input.Search
                placeholder="Tìm kiếm theo mã sản phẩm tồn kho"
                allowClear
                value={inventorySearchText}
                onChange={(e) => setInventorySearchText(e.target.value)}
                onSearch={(value) => setInventorySearchText(value)}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              <Table
                className="pb-6"
                loading={inventoryLoading}
                rowKey="id"
                dataSource={getFilteredInventoryItems()}
                pagination={false}
                columns={[
                  {
                    title: "Mã sản phẩm tồn kho",
                    dataIndex: "id",
                    key: "id",
                    ellipsis: true,
                  },
                  // Chỉ thêm cột "Thao tác" khi đúng điều kiện
                  ...(userRole === AccountRole.WAREHOUSE_MANAGER &&
                  [ExportStatus.IN_PROGRESS, ExportStatus.COUNTED].includes(
                    exportRequest?.status
                  )
                    ? [
                        {
                          title: "Thao tác",
                          key: "action",
                          width: 80,
                          render: (_, record) => (
                            <Button
                              size="small"
                              icon={<SwapOutlined />}
                              onClick={() => {
                                setSelectedOldItem(record);
                                setExpandedModal(true);
                                fetchAvailableInventoryItems(
                                  selectedExportRequestDetail?.itemId
                                );
                              }}
                              className="hover:bg-blue-50"
                            >
                              Đổi
                            </Button>
                          ),
                        },
                      ]
                    : []),
                ]}
                size="small"
                rowClassName={(record, index) => {
                  if (record.id === selectedOldItem?.id) return "bg-blue-100";
                  return index % 2 === 1 ? "bg-gray-50" : "";
                }}
              />
            </div>
          </div>

          {/* Phần bên phải - Danh sách available items (chỉ hiện khi expand) */}
          {expandedModal && (
            <div
              style={{
                flex: "0 0 48%",
                borderLeft: "2px solid #f0f0f0",
                paddingLeft: "20px",
              }}
            >
              <div className="mb-4">
                <h3 className="text-base font-semibold mb-2">
                  Sản phẩm có sẵn để thay thế
                </h3>
                <p className="text-sm text-gray-600">
                  Chọn sản phẩm bên dưới để thay thế cho:{" "}
                  <strong>{selectedOldItem?.id}</strong>
                </p>
              </div>

              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {availableItemsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Spin />
                  </div>
                ) : availableInventoryItems.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Không có sản phẩm khả dụng để thay thế
                  </div>
                ) : (
                  <Table
                    rowKey="id"
                    dataSource={availableInventoryItems}
                    pagination={false}
                    columns={[
                      {
                        title: "Mã sản phẩm",
                        dataIndex: "id",
                        key: "id",
                        ellipsis: true,
                      },
                      {
                        title: "Ngày nhập",
                        dataIndex: "importedDate",
                        key: "importedDate",
                        width: 100,
                        render: (date) => dayjs(date).format("DD/MM/YYYY"),
                      },
                      {
                        title: "",
                        key: "select",
                        width: 80,
                        render: (_, record) => (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => {
                              setSelectedNewItem(record);
                              setConfirmSwapModalVisible(true);
                            }}
                          >
                            Chọn
                          </Button>
                        ),
                      },
                    ]}
                    size="small"
                    rowClassName={(record, index) =>
                      index % 2 === 1 ? "bg-gray-50" : ""
                    }
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
      <Modal
        open={confirmSwapModalVisible}
        onCancel={() => {
          setConfirmSwapModalVisible(false);
          setSelectedNewItem(null);
        }}
        onOk={handleSwapItem}
        title={
          <span style={{ fontWeight: 700, fontSize: "18px" }}>
            Xác nhận đổi sản phẩm
          </span>
        }
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={inventoryLoading}
        width={500}
        centered
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Từ:</p>
              <p className="font-semibold text-red-700">
                {selectedOldItem?.id}
              </p>
              <p className="text-sm text-gray-500">
                {selectedOldItem?.storedLocationName}
              </p>
            </div>
            <SwapOutlined className="text-xl text-gray-400" />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Sang:</p>
              <p className="font-semibold text-green-700">
                {selectedNewItem?.id}
              </p>
              <p className="text-sm text-gray-500">
                {selectedNewItem?.storedLocationName}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded">
            <ExclamationCircleOutlined className="mt-0.5" />
            <p className="text-sm">
              Hành động này sẽ thay thế sản phẩm trong phiếu xuất. Vui lòng kiểm
              tra kỹ thông tin trước khi xác nhận.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExportRequestDetail;
