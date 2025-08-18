import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
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
} from "antd";
import { ArrowLeftOutlined, UserAddOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { AccountRole, StockcheckStatus, DetailStatus } from "@/utils/enums";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { usePusherContext } from "@/contexts/pusher/PusherContext";

//Components
import StatusTag from "@/components/commons/StatusTag";
import AssignStockCheckStaffModal from "@/components/stock-check-flow/stock-check-detail/AssignStockCheckStaffModal";
import StockCheckConfirmationModal from "@/components/stock-check-flow/stock-check-detail/StockCheckConfirmationModal";
import CompleteStockCheckModal from "@/components/stock-check-flow/stock-check-detail/CompleteStockCheckModal";
import StockCheckDetailsTable from "@/components/stock-check-flow/stock-check-detail/StockCheckDetailsTable";

//Services import
import useStockCheckService from "@/services/useStockCheckService";
import useStockCheckDetailService from "@/services/useStockCheckDetailService";
import useAccountService from "@/services/useAccountService";
import useItemService from "@/services/useItemService";
import useConfigurationService from "@/services/useConfigurationService";
import useInventoryItemService from "@/services/useInventoryItemService";

const enrichDetailsWithLocalData = (details, itemsData) => {
  return details.map((detail) => {
    const itemInfo = itemsData.find(
      (item) => String(item.id) === String(detail.itemId)
    );
    return {
      ...detail,
      itemName: itemInfo?.name || detail.itemName || "Không xác định",
      unitType: itemInfo?.unitType || "",
      measurementUnit: itemInfo?.measurementUnit || "",
      // Thêm rõ ràng quy cách chuẩn từ item
      standardMeasurementValue: itemInfo?.measurementValue || 0, // Quy cách chuẩn
    };
  });
};

const StockCheckRequestDetail = () => {
  const { stockCheckId } = useParams();
  const navigate = useNavigate();
  const userRole = useSelector((state) => state.user.role);

  // Services
  const {
    getStockCheckRequestById,
    assignStaffToStockCheck,
    updateStockCheckStatus,
    completeStockCheck,
    loading: stockCheckLoading,
  } = useStockCheckService();
  const {
    getStockCheckDetailById,
    getStockCheckDetailByDetailId,
    loading: stockCheckDetailLoading,
  } = useStockCheckDetailService();
  const { findAccountById, getActiveStaffsInDay } = useAccountService();
  const { getItems } = useItemService();
  const { getConfiguration } = useConfigurationService();
  const { getInventoryItemsByItemId } = useInventoryItemService();
  const { latestNotification } = usePusherContext();

  // States
  const [stockCheckRequest, setStockCheckRequest] = useState(null);
  const [stockCheckDetails, setStockCheckDetails] = useState([]);
  const [assignedWarehouseKeeper, setAssignedWarehouseKeeper] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [staffs, setStaffs] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [configuration, setConfiguration] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [confirmCountedChecked, setConfirmCountedChecked] = useState(false);
  const [modalPagination, setModalPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [allStockCheckDetails, setAllStockCheckDetails] = useState([]);
  const [viewedPages, setViewedPages] = useState(new Set([1]));
  const [selectedDetailIds, setSelectedDetailIds] = useState([]);

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [modalInventoryItems, setModalInventoryItems] = useState([]); // Used for modal detail
  const [checkedInventoryItems, setCheckedInventoryItems] = useState([]);
  const [inventorySearchText, setInventorySearchText] = useState("");
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [confirmCountedModalVisible, setConfirmCountedModalVisible] =
    useState(false);

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completeChecked, setCompleteChecked] = useState(false);

  // Fetch stock check request data
  const fetchStockCheckRequest = useCallback(async () => {
    if (!stockCheckId) return;

    try {
      const data = await getStockCheckRequestById(stockCheckId);
      setStockCheckRequest(data);
    } catch (error) {
      console.error("Error fetching stock check request:", error);
      message.error("Không thể tải thông tin phiếu kiểm kho");
    }
  }, [stockCheckId]);

  const fetchActiveStaffs = async () => {
    if (!stockCheckRequest?.startDate) {
      message.error("Ngày kiểm kê không hợp lệ");
      return;
    }

    try {
      setLoadingStaff(true);
      const activeStaffs = await getActiveStaffsInDay({
        date: stockCheckRequest.startDate,
        stockCheckId: stockCheckRequest.id,
      });
      setStaffs(activeStaffs);
    } catch (error) {
      console.error("Failed to fetch warehouse keepers:", error);
      message.error("Không thể tải danh sách nhân viên kho");
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchStockCheckDetails = useCallback(
    async (page = 1, pageSize = 10) => {
      if (!stockCheckId || items.length === 0) return;

      try {
        const response = await getStockCheckDetailById(stockCheckId);

        if (response) {
          // Enrich data với items info
          const enrichedData = enrichDetailsWithLocalData(response, items);

          // Sort: LACK và EXCESS lên đầu, MATCH xuống cuối
          const sortedData = enrichedData.sort((a, b) => {
            // Nếu a là MATCH và b không phải MATCH → a xuống sau
            if (
              a.status === DetailStatus.MATCH &&
              b.status !== DetailStatus.MATCH
            )
              return 1;
            // Nếu b là MATCH và a không phải MATCH → a lên trước
            if (
              b.status === DetailStatus.MATCH &&
              a.status !== DetailStatus.MATCH
            )
              return -1;
            // Các trường hợp khác giữ nguyên thứ tự
            return 0;
          });

          // Lưu all sorted data để dùng cho modal
          setAllStockCheckDetails(sortedData);

          // Phân trang cho table chính SAU KHI ĐÃ SORT
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedData = sortedData.slice(startIndex, endIndex);

          setStockCheckDetails(paginatedData);
          setPagination({
            current: page,
            pageSize: pageSize,
            total: response.length,
          });
        }
      } catch (error) {
        console.error("Error fetching stock check details:", error);
        message.error("Không thể tải chi tiết phiếu kiểm kho");
      }
    },
    [stockCheckId, items]
  );

  // Fetch assigned warehouse keeper info
  const fetchAssignedWarehouseKeeper = useCallback(async () => {
    if (!stockCheckRequest?.assignedWareHouseKeeperId) return;

    try {
      const keeperInfo = await findAccountById(
        stockCheckRequest.assignedWareHouseKeeperId
      );
      setAssignedWarehouseKeeper(keeperInfo);
    } catch (error) {
      console.error("Error fetching warehouse keeper:", error);
      setAssignedWarehouseKeeper(null);
    }
  }, [stockCheckRequest?.assignedWareHouseKeeperId]);

  // Effects
  useEffect(() => {
    if (stockCheckId) {
      fetchStockCheckRequest();
    }
  }, [stockCheckId]);

  // useEffect cho fetchStockCheckDetails
  useEffect(() => {
    if (items.length > 0 && stockCheckId) {
      fetchStockCheckDetails();
    }
  }, [items, stockCheckId, fetchStockCheckDetails]);

  // useEffect cho fetchAssignedWarehouseKeeper
  useEffect(() => {
    if (stockCheckRequest?.assignedWareHouseKeeperId) {
      fetchAssignedWarehouseKeeper();
    }
  }, [stockCheckRequest?.assignedWareHouseKeeperId]);

  useEffect(() => {
    if (allStockCheckDetails.length > 0) {
      // Auto select tất cả items, bao gồm cả những item có status MATCH
      const allIds = allStockCheckDetails.map((detail) => detail.id);
      setSelectedDetailIds(allIds);
    }
  }, [allStockCheckDetails]);

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
    if (latestNotification) {
      const isStockCheckEvent =
        latestNotification.type === `stock-check-created-${stockCheckId}` ||
        latestNotification.type === `stock-check-assigned-${stockCheckId}` ||
        latestNotification.type === `stock-check-counted-${stockCheckId}` ||
        latestNotification.type === `stock-check-confirmed-${stockCheckId}` ||
        latestNotification.type === `stock-check-completed-${stockCheckId}`;

      if (isStockCheckEvent) {
        console.log(
          "🔄 Reloading stock check detail...",
          latestNotification.type
        );
        reloadStockCheckDetail();
      }
    }
  }, [latestNotification]);

  // ========== UTILITY FUNCTIONS ==========
  // Thêm function này vào phần utility functions
  const reloadStockCheckDetail = () => {
    // Close all modals
    setAssignModalVisible(false);
    setConfirmCountedModalVisible(false);
    setCompleteModalVisible(false);
    setDetailModalVisible(false);

    // Reset form states
    setConfirmCountedChecked(false);
    setCompleteChecked(false);
    setSelectedStaffId(null);
    setSelectedDetail(null);
    setModalInventoryItems([]);
    setCheckedInventoryItems([]);
    setInventorySearchText("");
    setSearchText("");

    // Reset pagination states
    setModalPagination({ current: 1, pageSize: 10, total: 0 });
    setViewedPages(new Set([1]));
    setSelectedDetailIds([]);

    // Refetch all data
    fetchStockCheckRequest();
    fetchStockCheckDetails();
    if (stockCheckRequest?.assignedWareHouseKeeperId) {
      fetchAssignedWarehouseKeeper();
    }
  };

  // Handlers
  const handleBack = () => {
    navigate(-1);
  };

  const handleCreateNewStockCheck = async () => {
    try {
      const unapprovedItems = allStockCheckDetails.filter(
        (detail) => detail?.isChecked === false
      );
      const unapprovedItemIds = unapprovedItems.map((item) => item?.itemId);

      const response = await fetch("/template_kiem_kho.xlsx");
      if (!response.ok) {
        throw new Error("Không thể tải template");
      }
      const arrayBuffer = await response.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // Cách 1: Lấy theo index (bắt đầu từ 0)
      const worksheet = workbook.worksheets[0];

      // Kiểm tra worksheet tồn tại
      if (!worksheet) {
        throw new Error("Không tìm thấy worksheet trong template");
      }

      // Điền data - Sử dụng getCell đúng cách
      const cellB7 = worksheet.getCell("B7");
      if (cellB7) {
        cellB7.value = "Từ file excel được xuất từ phiếu kiểm kê";
      }

      // Điền danh sách mã sản phẩm
      unapprovedItemIds.forEach((itemId, index) => {
        const rowNumber = 10 + index;
        const cell = worksheet.getCell(`B${rowNumber}`);
        if (cell) {
          cell.value = itemId;
        }
      });

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `kiem_kho_chua_duyet_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      message.success("Đã xuất file Excel thành công");
    } catch (error) {
      message.error(`Không thể xuất file Excel: ${error.message}`);
    }
  };

  const handleSelectDetail = (detailId, checked) => {
    if (checked) {
      setSelectedDetailIds((prev) => [...prev, detailId]);
    } else {
      setSelectedDetailIds((prev) => prev.filter((id) => id !== detailId));
    }
  };

  const handleSelectAllDetails = (e) => {
    if (e.target.checked) {
      const allIds = allStockCheckDetails.map((detail) => detail.id);
      setSelectedDetailIds(allIds);
    } else {
      // Khi bỏ chọn "Select All", vẫn giữ lại những item có status MATCH
      const matchIds = allStockCheckDetails
        .filter((detail) => detail.status === DetailStatus.MATCH)
        .map((detail) => detail.id);
      setSelectedDetailIds(matchIds);
    }
  };

  const handleCompleteStockCheck = async () => {
    if (selectedDetailIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một chi tiết để hoàn thành");
      return;
    }

    // Hiện modal thay vì gọi API trực tiếp
    setCompleteModalVisible(true);
    setCompleteChecked(false);
  };

  const handleConfirmComplete = async () => {
    try {
      await completeStockCheck(selectedDetailIds);
      message.success("Đã xác nhận và cập nhật số lượng hàng tồn kho");

      await fetchStockCheckRequest();
      fetchStockCheckDetails();
      setSelectedDetailIds([]); // Reset selection
      setCompleteModalVisible(false);
      setCompleteChecked(false);
    } catch (error) {
      console.error("Lỗi khi hoàn thành stock check", error);
      message.error("Không thể hoàn thành stock check. Vui lòng thử lại.");
    }
  };

  const handleOpenAssignModal = async () => {
    setSelectedStaffId(null);
    // Lấy configuration
    try {
      const config = await getConfiguration();
      setConfiguration(config);
    } catch (e) {
      console.error("Error getting configuration:", e);
    }
    fetchActiveStaffs();
    setAssignModalVisible(true);
  };

  const handleCloseAssignModal = () => {
    setAssignModalVisible(false);
    setSelectedStaffId(null);
  };

  const handleAssignStockCheckStaff = async () => {
    if (!selectedStaffId || !stockCheckId) {
      message.warning("Vui lòng chọn nhân viên để phân công");
      return;
    }

    try {
      await assignStaffToStockCheck({
        stockCheckId: stockCheckId,
        staffId: selectedStaffId,
      });

      // Refresh data
      await fetchStockCheckRequest();
      setAssignModalVisible(false);
      setSelectedStaffId(null);
      message.success("Phân công nhân viên thành công");
    } catch (error) {
      console.error("Error assigning staff:", error);
      message.error("Không thể phân công nhân viên");
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  // Add function to handle confirm counted state
  const handleConfirmCounted = async () => {
    try {
      await updateStockCheckStatus(
        stockCheckId,
        StockcheckStatus.COUNT_CONFIRMED
      );
      message.success("Đã xác nhận kiểm kê");

      await fetchStockCheckRequest();
      fetchStockCheckDetails();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái", error);
      message.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    }
  };

  const canReassignStockCheckStaff = () => {
    if (
      !stockCheckRequest?.countingDate ||
      !stockCheckRequest?.countingTime ||
      !configuration?.timeToAllowAssign
    ) {
      return true;
    }

    // Combine countingDate and countingTime into a Date object
    const countingDateTime = new Date(
      `${stockCheckRequest.countingDate}T${stockCheckRequest.countingTime}`
    );

    // Convert timeToAllowAssign to milliseconds
    const [hours, minutes, seconds] = configuration.timeToAllowAssign
      .split(":")
      .map(Number);
    const allowAssignMs = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;

    // Deadline = countingTime - timeToAllowAssign
    const deadline = new Date(countingDateTime.getTime() - allowAssignMs);

    // If current time < deadline, allow reassignment
    return Date.now() < deadline.getTime();
  };

  const getRemainingAssignTime = () => {
    if (
      !stockCheckRequest?.countingDate ||
      !stockCheckRequest?.countingTime ||
      !configuration?.timeToAllowAssign
    ) {
      return null;
    }

    // 1. Thời điểm counting
    const countingDateTime = new Date(
      `${stockCheckRequest.countingDate}T${stockCheckRequest.countingTime}`
    );

    // 2. Hạn chót = counting time - timeToAllowAssign
    const [h, m, s] = configuration.timeToAllowAssign.split(":").map(Number);
    const allowAssignMs = (h * 3600 + m * 60 + s) * 1000;
    const deadline = new Date(countingDateTime.getTime() - allowAssignMs);

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
    // Assume làm việc cả ngày lẫn đêm (24h)
    return 24 * 60; // 1440 phút
  };

  const handleTableChange = (pag) => {
    fetchStockCheckDetails(pag.current, pag.pageSize);
  };

  // Function filter inventory items theo search text

  const getFilteredInventoryItems = () => {
    const itemsWithIndex = modalInventoryItems.map((item, originalIndex) => ({
      item,
      originalIndex,
    }));

    if (!inventorySearchText.trim()) {
      return itemsWithIndex;
    }

    return itemsWithIndex.filter(({ item }) =>
      item.toLowerCase().includes(inventorySearchText.toLowerCase())
    );
  };

  const hasViewedAllPages = () => {
    const totalPages = Math.ceil(
      allStockCheckDetails.length / modalPagination.pageSize
    );
    return totalPages <= 1 || viewedPages.size >= totalPages;
  };

  // Get stock check type text
  const getStockCheckTypeText = (type) => {
    switch (type) {
      case "SPOT_CHECK":
        return "Kiểm kho theo yêu cầu";
      case "PERIODIC":
        return "Kiểm kho định kì";
      default:
        return type;
    }
  };

  // Inventory items modal columns
  const inventoryColumns = [
    {
      title: "Mã sản phẩm tồn kho",
      dataIndex: "inventoryItemId",
      key: "inventoryItemId",
      render: (_, record) => {
        const itemId = record.item;
        const isChecked = checkedInventoryItems.includes(itemId);

        return (
          <div>
            <div>{itemId}</div>
            {isChecked && (
              <div className="text-xs text-blue-600 mt-1">Đã được kiểm</div>
            )}
          </div>
        );
      },
    },
  ];

  if (stockCheckLoading && !stockCheckRequest) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="mx-auto p-5">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="mr-4"
        >
          Quay lại
        </Button>
        <h1 className="text-xl font-bold m-0">
          Chi tiết phiếu kiểm kho #{stockCheckRequest?.id}
        </h1>
        {userRole === AccountRole.WAREHOUSE_MANAGER &&
          stockCheckRequest?.status === StockcheckStatus.IN_PROGRESS && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleOpenAssignModal}
              disabled={!canReassignStockCheckStaff()}
              title={
                !canReassignStockCheckStaff()
                  ? "Đã quá thời gian cho phép phân công lại"
                  : ""
              }
              className="ml-4"
            >
              Phân công lại nhân viên kiểm kê
            </Button>
          )}
      </div>

      {/* Stock Check Request Information */}
      <Card className="mb-6">
        <Descriptions
          title={
            <span
              style={{
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              Thông tin phiếu kiểm kho
            </span>
          }
          bordered
        >
          <Descriptions.Item
            label={<span style={{ fontWeight: "bold" }}>Mã phiếu kiểm</span>}
          >
            #{stockCheckRequest?.id}
          </Descriptions.Item>
          <Descriptions.Item
            label={<span style={{ fontWeight: "bold" }}>Loại kiểm kho</span>}
          >
            {stockCheckRequest?.type
              ? getStockCheckTypeText(stockCheckRequest.type)
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item
            label={<span style={{ fontWeight: "bold" }}>Trạng thái</span>}
          >
            {stockCheckRequest?.status ? (
              <StatusTag status={stockCheckRequest.status} type="stockcheck" />
            ) : (
              "-"
            )}
          </Descriptions.Item>
          <Descriptions.Item
            label={<span style={{ fontWeight: "bold" }}>Lý do kiểm kho</span>}
          >
            {stockCheckRequest?.stockCheckReason || "-"}
          </Descriptions.Item>

          <Descriptions.Item
            label={<span style={{ fontWeight: "bold" }}>Ngày bắt đầu</span>}
          >
            {stockCheckRequest?.startDate
              ? dayjs(stockCheckRequest.startDate).format("DD-MM-YYYY")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span style={{ fontWeight: "bold" }}>
                Ngày mong muốn hoàn thành
              </span>
            }
          >
            {stockCheckRequest?.expectedCompletedDate
              ? dayjs(stockCheckRequest.expectedCompletedDate).format(
                  "DD-MM-YYYY"
                )
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span style={{ fontWeight: "bold" }}>Người được phân công</span>
            }
          >
            {assignedWarehouseKeeper?.fullName || "Chưa phân công"}
          </Descriptions.Item>
          <Descriptions.Item
            label={<span style={{ fontWeight: "bold" }}>Ngày tạo</span>}
          >
            {stockCheckRequest?.createdDate
              ? dayjs(stockCheckRequest.createdDate).format("DD-MM-YYYY")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item
            label={<span style={{ fontWeight: "bold" }}>Người tạo</span>}
          >
            {stockCheckRequest?.createdBy || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Stock Check Details Table */}
      <div className="flex items-center justify-between mb-4 mt-5">
        <h2 className="font-bold" style={{ fontSize: "20px" }}>
          Chi tiết phiếu kiểm kho
        </h2>
        <div className="flex gap-2">
          {userRole === AccountRole.WAREHOUSE_MANAGER &&
            stockCheckRequest?.status === StockcheckStatus.COUNTED && (
              <Button
                type="primary"
                onClick={() => {
                  setConfirmCountedModalVisible(true);
                  setModalPagination({ current: 1, pageSize: 10, total: 0 });
                  setViewedPages(new Set([1]));
                  setConfirmCountedChecked(false);
                }}
              >
                Xác nhận số lượng đã kiểm kê
              </Button>
            )}

          {userRole === AccountRole.MANAGER &&
            stockCheckRequest?.status === StockcheckStatus.COUNT_CONFIRMED && (
              <Button
                type="primary"
                onClick={handleCompleteStockCheck}
                disabled={selectedDetailIds.length === 0}
              >
                Xác nhận và cập nhật kết quả kiểm kê ({selectedDetailIds.length}{" "}
                mục đã chọn)
              </Button>
            )}

          {/* Thêm button mới cho ROLE_DEPARTMENT */}
          {userRole === AccountRole.DEPARTMENT &&
            stockCheckRequest?.status === StockcheckStatus.COMPLETED &&
            allStockCheckDetails.filter((detail) => detail?.isChecked === false)
              .length > 0 && ( // Thêm điều kiện này
              <Button type="primary" onClick={handleCreateNewStockCheck}>
                <span className="font-bold">Xuất file Excel</span>
                (sản phẩm không được duyệt)
              </Button>
            )}
        </div>
      </div>

      <StockCheckDetailsTable
        stockCheckDetails={stockCheckDetails}
        stockCheckDetailLoading={stockCheckDetailLoading}
        pagination={pagination}
        onTableChange={handleTableChange}
        getInventoryItemsByItemId={getInventoryItemsByItemId}
        getStockCheckDetailByDetailId={getStockCheckDetailByDetailId}
        userRole={userRole}
        stockCheckStatus={stockCheckRequest?.status}
        selectedDetailIds={selectedDetailIds}
        onSelectDetail={handleSelectDetail}
        onSelectAllDetails={handleSelectAllDetails}
        allDetailIds={allStockCheckDetails.map((detail) => detail.id)}
      />

      {/* Inventory Items Detail Modal */}
      <Modal
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedDetail(null);
          setModalInventoryItems([]);
          setCheckedInventoryItems([]);
          setInventorySearchText("");
        }}
        title={
          <span style={{ fontWeight: 700, fontSize: "18px" }}>
            Danh sách sản phẩm tồn kho - #{selectedDetail?.itemId}
          </span>
        }
        footer={null}
        width={600}
        centered
      >
        {/* Search bar */}
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

        {/* Table container với sticky header */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <Table
            rowKey={(record) => record.originalIndex}
            dataSource={getFilteredInventoryItems()}
            pagination={false}
            columns={inventoryColumns}
            size="small"
            className="mb-4"
            rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-100" : "")}
          />
          {getFilteredInventoryItems().length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {inventorySearchText
                ? "Không tìm thấy sản phẩm tồn kho nào phù hợp"
                : "Không có sản phẩm tồn kho nào được liên kết"}
            </div>
          )}
        </div>
      </Modal>
      <AssignStockCheckStaffModal
        visible={assignModalVisible}
        onCancel={handleCloseAssignModal}
        onAssign={handleAssignStockCheckStaff}
        selectedStaffId={selectedStaffId}
        setSelectedStaffId={setSelectedStaffId}
        staffs={staffs}
        loadingStaff={loadingStaff}
        assignedStaff={assignedWarehouseKeeper}
        stockCheckRequest={stockCheckRequest}
        stockCheckLoading={stockCheckLoading}
        searchText={searchText}
        onSearch={handleSearch}
        getRemainingAssignTime={getRemainingAssignTime}
        calculateRemainingTime={calculateRemainingTime}
        getDefaultWorkingMinutes={getDefaultWorkingMinutes}
      />
      <StockCheckConfirmationModal
        visible={confirmCountedModalVisible}
        onCancel={() => {
          setConfirmCountedModalVisible(false);
          setModalPagination({ current: 1, pageSize: 10, total: 0 });
          setViewedPages(new Set([1]));
          setConfirmCountedChecked(false);
        }}
        onConfirm={async () => {
          await handleConfirmCounted();
          setConfirmCountedModalVisible(false);
          setModalPagination({ current: 1, pageSize: 10, total: 0 });
          setViewedPages(new Set([1]));
          setConfirmCountedChecked(false);
        }}
        title="Xác nhận số lượng kiểm kê"
        checkboxText="Tôi đã đọc và xác nhận các thông tin về sản phẩm đã được kiểm kê."
        confirmChecked={confirmCountedChecked}
        setConfirmChecked={setConfirmCountedChecked}
        allStockCheckDetails={allStockCheckDetails}
        modalPagination={modalPagination}
        setModalPagination={setModalPagination}
        viewedPages={viewedPages}
        setViewedPages={setViewedPages}
        hasViewedAllPages={hasViewedAllPages}
        loading={stockCheckLoading}
      />

      {/* Modal xác nhận và cập nhật số lượng hàng */}
      <CompleteStockCheckModal
        visible={completeModalVisible}
        onCancel={() => {
          setCompleteModalVisible(false);
          setCompleteChecked(false);
        }}
        onConfirm={handleConfirmComplete}
        confirmChecked={completeChecked}
        setConfirmChecked={setCompleteChecked}
        allStockCheckDetails={allStockCheckDetails}
        selectedDetailIds={selectedDetailIds}
        loading={stockCheckLoading}
      />
    </div>
  );
};

export default StockCheckRequestDetail;
