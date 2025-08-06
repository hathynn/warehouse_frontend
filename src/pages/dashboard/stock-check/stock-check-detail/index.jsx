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
} from "antd";
import { ArrowLeftOutlined, EyeOutlined } from "@ant-design/icons";
import useStockCheckService from "@/services/useStockCheckService";
import useStockCheckDetailService from "@/services/useStockCheckDetailService";
import useAccountService from "@/services/useAccountService";
import StatusTag from "@/components/commons/StatusTag";
import dayjs from "dayjs";

const StockCheckRequestDetail = () => {
  const { stockCheckId } = useParams(); // Dùng stockCheckId theo route definition
  const navigate = useNavigate();

  console.log("Route param stockCheckId:", stockCheckId); // Debug log

  // Services
  const { getStockCheckRequestById, loading: stockCheckLoading } =
    useStockCheckService();
  const { getStockCheckDetailById, loading: stockCheckDetailLoading } =
    useStockCheckDetailService();
  const { findAccountById } = useAccountService();

  // States
  const [stockCheckRequest, setStockCheckRequest] = useState(null);
  const [stockCheckDetails, setStockCheckDetails] = useState([]);
  const [assignedWarehouseKeeper, setAssignedWarehouseKeeper] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);

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

  const fetchStockCheckDetails = useCallback(
    async (page = 1, pageSize = 10) => {
      if (!stockCheckId) return;

      try {
        const response = await getStockCheckDetailById(stockCheckId);

        if (response && response.content) {
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedData = response.content.slice(startIndex, endIndex);

          setStockCheckDetails(paginatedData);
          setPagination({
            current: page,
            pageSize: pageSize,
            total: response.content.length,
          });
        }
      } catch (error) {
        console.error("Error fetching stock check details:", error);
        message.error("Không thể tải chi tiết phiếu kiểm kho");
      }
    },
    [stockCheckId] // ✅ CHỈ CẦN stockCheckId, BỎ getStockCheckDetailById
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
    if (stockCheckId) {
      fetchStockCheckDetails();
    }
  }, [stockCheckId]);

  // useEffect cho fetchAssignedWarehouseKeeper
  useEffect(() => {
    if (stockCheckRequest?.assignedWareHouseKeeperId) {
      fetchAssignedWarehouseKeeper();
    }
  }, [stockCheckRequest?.assignedWareHouseKeeperId]);

  // Handlers
  const handleBack = () => {
    navigate(-1);
  };

  const handleTableChange = (pag) => {
    fetchStockCheckDetails(pag.current, pag.pageSize);
  };

  const handleViewDetail = (record) => {
    setSelectedDetail(record);
    setInventoryItems(record.inventoryItemIds || []);
    setDetailModalVisible(true);
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

  //   // Get status for detail items (similar to export request detail)
  //   const getDetailStatus = (actualQuantity, quantity) => {
  //     if (actualQuantity === 0 && quantity > 0) return "NOT_COUNTED";
  //     if (actualQuantity < quantity) return "LACK";
  //     if (actualQuantity === quantity) return "MATCH";
  //     if (actualQuantity > quantity) return "EXCESS";
  //     return "UNKNOWN";
  //   };

  // Table columns
  const columns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      width: "18%",
      render: (id) => `${id}`,
    },
    {
      title: "Giá trị đo lường",
      dataIndex: "measurementValue",
      key: "measurementValue",
      width: "15%",
      align: "center",
      render: (text) => (
        <span style={{ fontWeight: "600", fontSize: "16px" }}>{text}</span>
      ),
    },
    {
      title: "Số lượng cần kiểm",
      dataIndex: "quantity",
      key: "quantity",
      width: "15%",
      align: "center",
      render: (text) => (
        <span style={{ fontWeight: "600", fontSize: "16px" }}>{text}</span>
      ),
    },
    {
      title: "Số lượng thực tế",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      width: "15%",
      align: "center",
      render: (text, record) => {
        const isLacking = text < record.quantity;
        const isExcess = text > record.quantity;

        return (
          <span
            className={
              isLacking
                ? "text-red-600 font-semibold"
                : isExcess
                ? "text-orange-600 font-semibold"
                : "text-green-600 font-semibold"
            }
            style={{ fontSize: "16px" }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "Giá trị đo lường thực tế",
      dataIndex: "actualMeasurementValue",
      key: "actualMeasurementValue",
      width: "18%",
      align: "center",
      render: (text, record) => {
        const isLacking = text < record.measurementValue;
        const isExcess = text > record.measurementValue;

        return (
          <span
            className={
              isLacking
                ? "text-red-600 font-semibold"
                : isExcess
                ? "text-orange-600 font-semibold"
                : "text-green-600 font-semibold"
            }
            style={{ fontSize: "16px" }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: "12%",
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
      render: (_, record, index) =>
        inventoryItems[index] || `Item ${index + 1}`,
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
            label={
              <span style={{ fontWeight: "bold" }}>Mã phiếu kiểm kho</span>
            }
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
        }}
        title={
          <span style={{ fontWeight: 700, fontSize: "18px" }}>
            Danh sách sản phẩm tồn kho - {selectedDetail?.itemId}
          </span>
        }
        footer={null}
        width={600}
        centered
      >
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <Table
            rowKey={(record, index) => index}
            dataSource={inventoryItems.map((item, index) => ({
              inventoryItemId: item,
              index: index,
            }))}
            pagination={false}
            columns={inventoryColumns}
            size="small"
            className="mb-4"
          />
          {inventoryItems.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Không có sản phẩm tồn kho nào được liên kết
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StockCheckRequestDetail;
