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
  Tag,
  Tooltip,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import StatusTag from "@/components/commons/StatusTag";
import AssignStockCheckStaffModal from "@/components/stock-check-flow/stock-check-detail/AssignStockCheckStaffModal";
import { AccountRole } from "@/utils/enums";

//Services import
import useStockCheckService from "@/services/useStockCheckService";
import useStockCheckDetailService from "@/services/useStockCheckDetailService";
import useAccountService from "@/services/useAccountService";
import useItemService from "@/services/useItemService";
import useConfigurationService from "@/services/useConfigurationService";
import { useSelector } from "react-redux";

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

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [checkedInventoryItems, setCheckedInventoryItems] = useState([]);
  const [inventorySearchText, setInventorySearchText] = useState("");
  const [assignModalVisible, setAssignModalVisible] = useState(false);

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
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;

          // Enrich data với items info
          const enrichedData = enrichDetailsWithLocalData(response, items);
          const paginatedData = enrichedData.slice(startIndex, endIndex);

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
    [stockCheckId, items] // Thêm items vào dependency
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

  // Handlers
  const handleBack = () => {
    navigate(-1);
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

  // TODO: Implement these functions similar to export logic
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

  const handleViewDetail = async (record) => {
    setSelectedDetail(record);
    setInventorySearchText("");

    try {
      const response = await getStockCheckDetailByDetailId(record.id);

      if (response) {
        const allInventoryItems = response.inventoryItemIds || [];
        const checkedItems = response.checkedInventoryItemIds || [];

        setInventoryItems(allInventoryItems);
        setCheckedInventoryItems(checkedItems);
      } else {
        setInventoryItems(record.inventoryItemIds || []);
        setCheckedInventoryItems([]);
      }
    } catch (error) {
      console.error("Error fetching inventory detail:", error);
      setInventoryItems(record.inventoryItemIds || []);
      setCheckedInventoryItems([]);
    }

    setDetailModalVisible(true);
  };

  // Function filter inventory items theo search text
  const getFilteredInventoryItems = () => {
    const itemsWithIndex = inventoryItems.map((item, originalIndex) => ({
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

  const columns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      width: "16%",
      render: (id, record) => (
        <div>
          <span style={{ fontWeight: "bold", fontSize: "18px" }}>{id}</span>
          <div className="text-gray-500 mt-1" style={{ fontSize: "12px" }}>
            (Quy cách chuẩn: {record.standardMeasurementValue || "-"}{" "}
            {record.measurementUnit || ""}/{record.unitType || ""})
          </div>
        </div>
      ),
    },
    {
      title: "Số lượng cần kiểm",
      dataIndex: "quantity",
      key: "quantity",
      width: "13%",
      align: "center",
      render: (text, record) => (
        <div style={{ textAlign: "center" }}>
          <span style={{ fontWeight: "600", fontSize: "18px" }}>{text}</span>{" "}
          {record.unitType && (
            <span className="text-gray-500">{record.unitType}</span>
          )}
        </div>
      ),
    },
    {
      title: "Tổng giá trị đo lường",
      dataIndex: "measurementValue", // Đây là giá trị cần kiểm từ stock check detail
      key: "measurementValue",
      width: "13%",
      align: "center",
      render: (text, record) => (
        <div style={{ textAlign: "center" }}>
          <span style={{ fontWeight: "600", fontSize: "18px" }}>{text}</span>{" "}
          {record.measurementUnit && (
            <span className="text-gray-500">{record.measurementUnit}</span>
          )}
        </div>
      ),
    },
    {
      title: "Số lượng đã kiểm",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      width: "13%",
      align: "center",
      render: (text, record) => {
        const isLacking = text < record.quantity;
        const isExcess = text > record.quantity;

        return (
          <div style={{ textAlign: "center" }}>
            <span
              className={
                isLacking
                  ? "text-red-600 font-semibold"
                  : isExcess
                  ? "text-orange-600 font-semibold"
                  : "text-green-600 font-semibold"
              }
              style={{ fontSize: "18px" }}
            >
              {text}
            </span>{" "}
            {record.unitType && (
              <span className="text-gray-500">{record.unitType}</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Tổng giá trị đã kiểm",
      dataIndex: "actualMeasurementValue",
      key: "actualMeasurementValue",
      width: "18%",
      align: "center",
      render: (text, record) => {
        const isLacking = text < record.measurementValue;
        const isExcess = text > record.measurementValue;

        return (
          <div style={{ textAlign: "center" }}>
            <span
              className={
                isLacking
                  ? "text-red-600 font-semibold"
                  : isExcess
                  ? "text-orange-600 font-semibold"
                  : "text-green-600 font-semibold"
              }
              style={{ fontSize: "18px" }}
            >
              {text}
            </span>{" "}
            {record.measurementUnit && (
              <span className="text-gray-500">{record.measurementUnit}</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: "10%",
      align: "center",
      render: (status, record) => {
        // Nếu status từ API là null hoặc undefined, hiển thị dấu "-"
        if (!status) {
          return "-";
        }

        const statusConfig = {
          LACK: { color: "error", text: "Thiếu" },
          MATCH: { color: "success", text: "Đủ" },
          EXCESS: { color: "warning", text: "Thừa" },
        };

        const config = statusConfig[status];

        // Nếu status không nằm trong config, hiển thị status gốc
        if (!config) {
          return status;
        }

        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Chi tiết",
      key: "detail",
      width: "7%",
      align: "center",
      render: (text, record) => (
        <Tooltip title="Xem danh sách sản phẩm tồn kho" placement="top">
          <span
            className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer"
            style={{ width: 32, height: 32 }}
            onClick={() => handleViewDetail(record)}
          >
            <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
          </span>
        </Tooltip>
      ),
    },
  ];

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
          stockCheckRequest?.status === "IN_PROGRESS" && (
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
      <Card
        title={
          <span
            style={{
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            Chi tiết phiếu kiểm kho
          </span>
        }
        className="mb-6 mt-10"
      >
        <Table
          columns={columns}
          dataSource={stockCheckDetails}
          rowKey="id"
          loading={stockCheckDetailLoading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} sản phẩm`,
          }}
          onChange={handleTableChange}
          className="[&_.ant-table-cell]:!p-3"
        />
      </Card>

      {/* Inventory Items Detail Modal */}
      <Modal
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedDetail(null);
          setInventoryItems([]);
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
            rowClassName={(_, index) => (index % 2 === 0 ? "bg-gray-100" : "")}
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
    </div>
  );
};

export default StockCheckRequestDetail;
