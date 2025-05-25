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
} from "antd";
import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import useExportRequestService from "../../../../hooks/useExportRequestService";
import useExportRequestDetailService from "../../../../hooks/useExportRequestDetailService";
import useItemService from "../../../../hooks/useItemService";
import { useSelector } from "react-redux";
import useConfigurationService from "@/hooks/useConfigurationService";
import useAccountService from "@/hooks/useAccountService";
import { AccountRole, ExportStatus } from "@/utils/enums";
import StatusTag from "@/components/commons/StatusTag";
import LackProductTable from "@/components/export-flow/export-detail/LackProductTable";
import UpdateExportDateTimeModal from "@/components/export-flow/export-detail/UpdateExportDateTimeModal";
import ProductDetailTable from "@/components/export-flow/export-detail/ProductDetailTable";

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
    createExportRequestProduction,
  } = useExportRequestService();
  const { getExportRequestDetails, createExportRequestDetail } =
    useExportRequestDetailService();
  const { getItemById } = useItemService();
  const [exportRequest, setExportRequest] = useState(null);
  const [exportRequestDetails, setExportRequestDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
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
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [assignedStaff, setAssignedStaff] = useState(null);
  const [searchText, setSearchText] = useState("");
  const userRole = useSelector((state) => state.user.role);
  //Modal confirm counted
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  //Modal update date time
  const [updateDateTimeModalOpen, setUpdateDateTimeModalOpen] = useState(false);

  const [assignKeeperModalVisible, setAssignKeeperModalVisible] =
    useState(false);
  const [assigningKeeper, setAssigningKeeper] = useState(false);
  const [selectedKeeperId, setSelectedKeeperId] = useState(null);
  const [assignedKeeper, setAssignedKeeper] = useState(null);
  const [keeperStaffs, setKeeperStaffs] = useState([]);
  const [loadingKeeperStaff, setLoadingKeeperStaff] = useState(false);

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completeChecked, setCompleteChecked] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false); // đặt bên ngoài modal

  const [editMode, setEditMode] = useState(false);
  const [editedDetails, setEditedDetails] = useState([]); // clone chi tiết khi edit
  const [creating, setCreating] = useState(false); // loading khi gọi API tạo mới

  // Hàm lấy thông tin phiếu xuất
  const fetchExportRequestData = useCallback(async () => {
    if (!exportRequestId) return;
    try {
      setLoading(true);
      const data = await getExportRequestById(exportRequestId);
      setExportRequest(data);
    } catch (error) {
      console.error("Failed to fetch export request:", error);
      message.error("Không thể tải thông tin phiếu xuất");
    } finally {
      setLoading(false);
    }
  }, [exportRequestId, getExportRequestById]);

  // Hàm "enrich" danh sách chi tiết sản phẩm bằng cách lấy itemName từ API
  const enrichDetails = async (details) => {
    const enriched = await Promise.all(
      details.map(async (detail) => {
        try {
          const res = await getItemById(String(detail.itemId));
          const itemName =
            res && res.content ? res.content.name : "Không xác định";
          return { ...detail, itemName };
        } catch (error) {
          console.error(`Error fetching item with id ${detail.itemId}:`, error);
          return { ...detail, itemName: "Không xác định" };
        }
      })
    );
    return enriched;
  };

  const fetchDetails = async (
    page = pagination.current,
    pageSize = pagination.pageSize
  ) => {
    if (!exportRequestId) return;
    try {
      setDetailsLoading(true);
      const response = await getExportRequestDetails(
        exportRequestId,
        page,
        pageSize
      );
      if (response && response.content) {
        const enriched = await enrichDetails(response.content);
        setExportRequestDetails(enriched);
        const meta = response.metaDataDTO;
        setPagination({
          current: meta ? meta.page : page,
          pageSize: meta ? meta.limit : pageSize,
          total: meta ? meta.total : 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch export request details:", error);
      message.error("Không thể tải danh sách chi tiết phiếu xuất");
    } finally {
      setDetailsLoading(false);
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
    try {
      setLoadingKeeperStaff(true);
      const activeStaffs = await getActiveStaffsInDay({
        date: exportRequest.exportDate,
        exportRequestId: exportRequest.exportRequestId,
      });
      setKeeperStaffs(activeStaffs);
    } catch (error) {
      message.error("Không thể tải danh sách nhân viên xuất hàng");
    } finally {
      setLoadingKeeperStaff(false);
    }
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
    fetchDetails();
  }, []);

  useEffect(() => {
    if (exportRequest?.countingStaffId) {
      fetchAssignedCountingStaff();
    }
  }, [exportRequest]);

  useEffect(() => {
    fetchAssignedKeeper();
  }, [exportRequest?.assignedWareHouseKeeperId]);

  // Huỷ tạo phiếu
  const handleCancelCreateExport = () => {
    setEditMode(false);
    setEditedDetails([]);
  };

  // Xác nhận tạo phiếu xuất mới (có gọi cả API chi tiết)
  const handleConfirmCreateExport = async () => {
    setCreating(true);
    try {
      // Lấy info phiếu xuất gốc
      const exportRequestInfo = await getExportRequestById(exportRequestId);

      if (exportRequestInfo && exportRequestInfo.type === "PRODUCTION") {
        // 1. Gọi API tạo phiếu xuất mới
        const body = {
          exportReason: exportRequestInfo.exportReason,
          receiverName: exportRequestInfo.receiverName,
          receiverPhone: exportRequestInfo.receiverPhone,
          departmentId: exportRequestInfo.departmentId,
          receiverAddress: exportRequestInfo.receiverAddress,
          countingDate: exportRequestInfo.countingDate,
          countingTime: exportRequestInfo.countingTime,
          type: exportRequestInfo.type,
          exportDate: exportRequestInfo.exportDate,
          exportTime: exportRequestInfo.exportTime,
        };
        const createdExportRequest = await createExportRequestProduction(body);

        // 2. Chuẩn bị mảng chi tiết
        const details = editedDetails.map((d) => ({
          itemId: d.itemId,
          quantity: d.quantity,
          measurementValue: d.measurementValue,
          inventoryItemId: d.inventoryItemId,
        }));

        // 3. Gọi API tạo chi tiết
        if (createdExportRequest?.exportRequestId) {
          await createExportRequestDetail(
            details,
            createdExportRequest.exportRequestId
          );
          setEditMode(false);
          setEditedDetails([]);
          message.success("Tạo phiếu xuất mới thành công");

          // Gọi lại fetch data nếu muốn
        } else {
          message.error("Không lấy được exportRequestId mới");
        }
        //luồng hủy
        await updateExportRequestStatus(
          exportRequestId,
          ExportStatus.CANCELLED
        );
        message.success("Đã hủy phiếu xuất hiện tại");
        await fetchExportRequestData();
        fetchDetails();
      } else {
        message.error("Chỉ hỗ trợ tạo phiếu xuất cho loại Production.");
      }
    } catch (err) {
      // message.error đã xử lý ở API
      message.error("Không thể hủy phiếu xuất");
      console.error("Failed to create export request:", err);
    } finally {
      setCreating(false);
    }
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
    setCompleting(true);
    try {
      await updateExportRequestStatus(exportRequestId, ExportStatus.COMPLETED);
      message.success("Xác nhận hoàn thành phiếu xuất thành công");
      setCompleteModalVisible(false);
      setCompleteChecked(false);
      await fetchExportRequestData();
      fetchDetails();
    } catch (err) {
      message.error("Không thể xác nhận hoàn thành phiếu xuất");
    } finally {
      setCompleting(false);
    }
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

    try {
      setAssigningStaff(true);
      await assignCountingStaff(exportRequestId, selectedStaffId);

      const exportRequestResponse = await fetchExportRequestData();
      if (exportRequestResponse?.content?.countingStaffId) {
        await findAccountById(exportRequestResponse.content.countingStaffId);
      }
      await fetchActiveStaffs();

      message.success("Phân công nhân viên thành công");
      setSelectedStaffId(null);
    } catch (error) {
      console.error("Failed to assign warehouse keeper:", error);
      message.error("Không thể phân công nhân viên. Vui lòng thử lại");
    } finally {
      setAssigningStaff(false);
    }
  };

  const getExportTypeText = (type) => {
    if (type === "PRODUCTION") return "Xuất sản xuất";
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

    try {
      setAssigningKeeper(true);
      await assignConfirmimgStaff(exportRequestId, selectedKeeperId);
      await fetchExportRequestData();
      message.success("Phân công nhân viên xuất hàng thành công");
      setAssignKeeperModalVisible(false);
      setSelectedKeeperId(null);
    } catch (error) {
      message.error(
        "Không thể phân công nhân viên xuất hàng. Vui lòng thử lại"
      );
    } finally {
      setAssigningKeeper(false);
    }
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

  const ITEM_STATUS_SHOW_STATUSES = [
    ExportStatus.COUNT_CONFIRMED,
    // ExportStatus.WAITING_EXPORT,
    // ExportStatus.CONFIRMED,
    // ExportStatus.COMPLETED,
    // ExportStatus.CANCELLED,
  ];

  const getItemStatus = () => {
    if (!exportRequestDetails || exportRequestDetails.length === 0) return null;
    const hasLack = exportRequestDetails.some((d) => d.status === "LACK");
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
      <Descriptions.Item label="Ngày xuất" key="exportDate">
        {exportRequest.exportDate
          ? new Date(exportRequest.exportDate).toLocaleDateString("vi-VN")
          : "-"}
      </Descriptions.Item>
    );

    if (exportRequest.type === "PRODUCTION") {
      items.push(
        <Descriptions.Item label="Loại phiếu xuất" key="exportType">
          {getExportTypeText(exportRequest.type)}
        </Descriptions.Item>,
        // <Descriptions.Item label="Phòng ban" key="receivingDepartment">
        //   {exportRequest.departmentId || "-"}
        // </Descriptions.Item>,
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
        <Descriptions.Item label="Số điện thoại nhận hàng" key="receiverPhone">
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
      render: (id) => `#${id}`,
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
      width: 140,
      align: "right",
      render: (text) => <div style={{ textAlign: "right" }}>{text}</div>,
    },
    {
      title: "Số lượng đã đóng gói",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
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
    {
      title: "Quy cách",
      dataIndex: "measurementValue",
      key: "measurementValue",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status ? <StatusTag status={status} type="detail" /> : "-", // Use StatusTag component with 'detail' type
    },
  ];

  const handleTableChange = (pag) => {
    setPagination({
      ...pagination,
      current: pag.current,
      pageSize: pag.pageSize,
    });
    fetchDetails(pag.current, pag.pageSize);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && !exportRequest) {
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
      </div>

      <Card className="mb-6">
        <Descriptions title="Thông tin phiếu xuất" bordered>
          {renderDescriptionItems()}
        </Descriptions>
      </Card>
      {}

      <ProductDetailTable
        columns={columns}
        exportRequestDetails={editMode ? editedDetails : exportRequestDetails}
        detailsLoading={detailsLoading}
        pagination={pagination}
        handleTableChange={handleTableChange}
        userRole={userRole}
        exportRequest={exportRequest}
        setConfirmModalVisible={setConfirmModalVisible}
        editMode={editMode}
        setEditMode={setEditMode}
        editedDetails={editedDetails}
        setEditedDetails={setEditedDetails}
        creating={creating}
        onCancelCreateExport={handleCancelCreateExport}
        onConfirmCreateExport={handleConfirmCreateExport}
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
            loading={assigningStaff}
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
            loading={assigningKeeper}
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
        onCancel={() => setConfirmModalVisible(false)}
        onOk={async () => {
          await handleConfirmCounted();
          setConfirmModalVisible(false);
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
          disabled: !confirmChecked, // disable nếu chưa tick
        }}
      >
        <div className="mb-4 font-semibold">
          Tổng sản phẩm kiểm đếm: {exportRequestDetails.length} sản phẩm
        </div>

        <div className="mb-4 font-semibold">
          Tổng số sản phẩm có trạng thái thiếu:{" "}
          <span className="text-red-600">
            {exportRequestDetails.filter((d) => d.status === "LACK").length}
          </span>{" "}
          sản phẩm
        </div>

        {exportRequestDetails.some((d) => d.status === "LACK") && (
          <>
            <div className="mb-2 font-semibold">Danh sách sản phẩm thiếu:</div>
            <LackProductTable
              data={exportRequestDetails.filter((d) => d.status === "LACK")}
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
      <Modal
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        onOk={handleConfirmComplete}
        okText="Xác nhận"
        cancelText="Quay lại"
        okButtonProps={{
          disabled: !completeChecked,
          loading: completing,
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
      <UpdateExportDateTimeModal
        open={updateDateTimeModalOpen}
        onCancel={() => setUpdateDateTimeModalOpen(false)}
        exportRequest={exportRequest || {}}
        updateExportDateTime={updateExportDateTime}
        updateExportRequestStatus={updateExportRequestStatus}
        loading={loading}
        onSuccess={async () => {
          setUpdateDateTimeModalOpen(false);
          await fetchExportRequestData();
        }}
      />
    </div>
  );
};

export default ExportRequestDetail;
