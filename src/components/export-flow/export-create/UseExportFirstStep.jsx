import React, { useState, useEffect } from "react";
import {
  Table,
  Empty,
  Spin,
  Alert,
  Tag,
  Card,
  Row,
  Col,
  Checkbox,
  Button,
} from "antd";
import useImportOrderService from "@/services/useImportOrderService";
import { Package, Calendar, Clock, Hash } from "lucide-react";
import PropTypes from "prop-types";

const UseExportFirstStep = ({
  onConfirm,
  initialSelectedOrder,
  initialSelectedItems,
}) => {
  const { getAllImportOrders, loading } = useImportOrderService();
  const [importOrders, setImportOrders] = useState([]);
  const [error, setError] = useState(null);
  const [checkAll, setCheckAll] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(
    initialSelectedOrder || null
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState(() => {
    if (initialSelectedItems && initialSelectedItems.length > 0) {
      return initialSelectedItems.map((item) => item.importOrderDetailId);
    }
    return [];
  });

  // Handle select all checkbox
  const handleCheckAllChange = (e) => {
    const checked = e.target.checked;
    setCheckAll(checked);
    if (checked && selectedOrder) {
      const allKeys = selectedOrder.importOrderDetails.map(
        (detail) => detail.importOrderDetailId
      );
      setSelectedRowKeys(allKeys);
    } else {
      setSelectedRowKeys([]);
    }
  };

  useEffect(() => {
    fetchImportOrders();
  }, []);

  useEffect(() => {
    // ✅ CHỈ SYNC KHI CÓ THAY ĐỔI selectedOrder VÀ CÓ initialSelectedItems
    if (
      selectedOrder &&
      initialSelectedItems &&
      initialSelectedItems.length > 0
    ) {
      const initialKeys = initialSelectedItems.map(
        (item) => item.importOrderDetailId
      );

      // ✅ ĐỒNG BỘ selectedRowKeys
      setSelectedRowKeys(initialKeys);

      // ✅ TÍNH TOÁN checkAll DỰA TRÊN initialKeys VÀ selectedOrder
      if (selectedOrder.importOrderDetails) {
        const allKeys = selectedOrder.importOrderDetails.map(
          (d) => d.importOrderDetailId
        );
        setCheckAll(
          initialKeys.length === allKeys.length && initialKeys.length > 0
        );
      }
    } else if (
      selectedOrder &&
      (!initialSelectedItems || initialSelectedItems.length === 0)
    ) {
      // ✅ KHI KHÔNG CÓ INITIAL ITEMS, RESET VỀ EMPTY
      setSelectedRowKeys([]);
      setCheckAll(false);
    }
  }, [selectedOrder, initialSelectedItems]);

  const fetchImportOrders = async () => {
    try {
      setError(null);
      const response = await getAllImportOrders();
      if (response?.content) {
        // Lọc chỉ lấy các đơn có status COMPLETED
        const completedOrders = response.content.filter(
          (order) => order.status === "COMPLETED"
        );
        setImportOrders(completedOrders);
      }
    } catch (err) {
      setError("Không thể tải danh sách đơn nhập");
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      LACK: { color: "warning", text: "Thiếu" },
      EXCESS: { color: "processing", text: "Thừa" },
      EXACT: { color: "success", text: "Đủ" },
    };
    const config = statusConfig[status] || { color: "default", text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  };

  // Handle continue button click
  const handleContinue = () => {
    if (selectedRowKeys.length > 0 && selectedOrder) {
      const selectedItems = selectedOrder.importOrderDetails
        .filter((detail) =>
          selectedRowKeys.includes(detail.importOrderDetailId)
        )
        .map((detail) => ({
          itemId: detail.itemId,
          itemName: detail.itemName,
          quantity: detail.actualQuantity,
          expectQuantity: detail.expectQuantity,
          actualQuantity: detail.actualQuantity,
          status: detail.status,
          importOrderDetailId: detail.importOrderDetailId,
        }));

      onConfirm({
        importOrder: selectedOrder,
        selectedItems: selectedItems,
        importOrderId: selectedOrder.importOrderId,
        importRequestId: selectedOrder.importRequestId,
      });
    }
  };

  // Columns cho bảng chi tiết
  const detailColumns = [
    {
      title: (
        <Checkbox
          checked={checkAll}
          onChange={handleCheckAllChange}
          disabled={
            !selectedOrder || selectedOrder.importOrderDetails.length === 0
          }
        />
      ),
      key: "selection",
      width: "5%",
      render: (_, record) => (
        <Checkbox
          checked={selectedRowKeys.includes(record.importOrderDetailId)}
          onChange={(e) => {
            const checked = e.target.checked;
            let newSelectedKeys;
            if (checked) {
              newSelectedKeys = [
                ...selectedRowKeys,
                record.importOrderDetailId,
              ];
            } else {
              newSelectedKeys = selectedRowKeys.filter(
                (key) => key !== record.importOrderDetailId
              );
            }

            // ✅ UPDATE selectedRowKeys
            setSelectedRowKeys(newSelectedKeys);

            // ✅ TỰ ĐỘNG TÍNH TOÁN checkAll DỰA TRÊN newSelectedKeys
            if (selectedOrder && selectedOrder.importOrderDetails) {
              const allKeys = selectedOrder.importOrderDetails.map(
                (d) => d.importOrderDetailId
              );
              setCheckAll(
                newSelectedKeys.length === allKeys.length &&
                  newSelectedKeys.length > 0
              );
            }
          }}
        />
      ),
    },
    {
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      width: "15%",
    },
    {
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
      width: "30%",
    },
    {
      title: "SL dự kiến",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
      width: "12%",
      align: "center",
    },
    {
      title: "SL thực nhận",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      width: "12%",
      align: "center",
    },
    {
      title: "Chênh lệch",
      key: "difference",
      width: "12%",
      align: "center",
      render: (_, record) => {
        const diff = record.actualQuantity - record.expectQuantity;
        return (
          <span
            style={{
              color: diff > 0 ? "#1890ff" : diff < 0 ? "#faad14" : "#52c41a",
              fontWeight: "bold",
            }}
          >
            {diff > 0 ? "+" : ""}
            {diff}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: "15%",
      align: "center",
      render: (status) => getStatusTag(status),
    },
  ];

  return (
    <div
      className="h-[66vh]"
      style={{ display: "flex", backgroundColor: "#f5f5f5" }}
    >
      {/* Phần bên trái - Danh sách Import Orders (1/3 màn hình) */}
      <div
        style={{
          width: "33.33%",
          backgroundColor: "#fff",
          borderRight: "1px solid #f0f0f0",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px", borderBottom: "1px solid #f0f0f0" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: 0,
            }}
          >
            <Package size={24} color="#1890ff" />
            Đơn nhập hoàn tất
          </h2>
          <p style={{ color: "#8c8c8c", marginTop: "8px", marginBottom: 0 }}>
            Tổng số: {importOrders.length} đơn
          </p>
        </div>

        {/* Danh sách - có scroll */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Spin size="large" />
            </div>
          ) : error ? (
            <Alert
              message="Lỗi"
              description={error}
              type="error"
              showIcon
              action={
                <button
                  onClick={fetchImportOrders}
                  style={{
                    background: "#1890ff",
                    color: "white",
                    border: "none",
                    padding: "4px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Thử lại
                </button>
              }
            />
          ) : importOrders.length === 0 ? (
            <Empty
              description="Không có đơn nhập nào đã hoàn tất"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div>
              {importOrders.map((order) => (
                <Card
                  key={order.importOrderId}
                  hoverable
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    marginBottom: "8px",
                    cursor: "pointer",
                    border:
                      selectedOrder?.importOrderId === order.importOrderId
                        ? "2px solid #1890ff"
                        : "1px solid #f0f0f0",
                    backgroundColor:
                      selectedOrder?.importOrderId === order.importOrderId
                        ? "#e6f7ff"
                        : "#fff",
                  }}
                  bodyStyle={{ padding: "12px" }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      {order.importOrderId}
                    </h4>
                  </div>

                  <div style={{ fontSize: "12px", color: "#595959" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <Hash size={12} style={{ marginRight: "4px" }} />
                      <span>Phiếu: {order.importRequestId}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Calendar size={12} style={{ marginRight: "4px" }} />
                      <span>{formatDate(order.actualDateReceived)}</span>
                      <Clock
                        size={12}
                        style={{ marginLeft: "8px", marginRight: "4px" }}
                      />
                      <span>{formatTime(order.actualTimeReceived)}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: "8px" }}>
                    <Tag>{order.importOrderDetails.length} mặt hàng</Tag>
                    {order.isExtended && <Tag color="warning">Đã gia hạn</Tag>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Phần bên phải - Chi tiết Import Order (2/3 màn hình) */}
      <div style={{ flex: 1, backgroundColor: "#fafafa", overflowY: "auto" }}>
        {selectedOrder ? (
          <div style={{ height: "100%" }}>
            {/* Header chi tiết */}
            <div
              style={{
                backgroundColor: "#fff",
                padding: "24px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  marginBottom: "16px",
                }}
              >
                Chi tiết đơn nhập
              </h2>

              <Row gutter={24}>
                <Col span={8}>
                  <div>
                    <p
                      style={{
                        color: "#8c8c8c",
                        marginBottom: "4px",
                        fontSize: "14px",
                      }}
                    >
                      Mã đơn nhập
                    </p>
                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        margin: 0,
                      }}
                    >
                      {selectedOrder.importOrderId}
                    </p>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <p
                      style={{
                        color: "#8c8c8c",
                        marginBottom: "4px",
                        fontSize: "14px",
                      }}
                    >
                      Mã phiếu nhập
                    </p>
                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        margin: 0,
                      }}
                    >
                      {selectedOrder.importRequestId}
                    </p>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <p
                      style={{
                        color: "#8c8c8c",
                        marginBottom: "4px",
                        fontSize: "14px",
                      }}
                    >
                      Ngày nhận thực tế
                    </p>
                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        margin: 0,
                      }}
                    >
                      {formatDate(selectedOrder.actualDateReceived)} -{" "}
                      {formatTime(selectedOrder.actualTimeReceived)}
                    </p>
                  </div>
                </Col>
              </Row>

              {selectedOrder.note && (
                <Alert
                  message={
                    <span>
                      <strong>Ghi chú:</strong> {selectedOrder.note}
                    </span>
                  }
                  type="info"
                  style={{ marginTop: "16px" }}
                />
              )}
            </div>

            {/* Danh sách chi tiết mặt hàng */}
            <div style={{ padding: "24px" }}>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginBottom: "16px",
                }}
              >
                Chi tiết mặt hàng ({selectedOrder.importOrderDetails.length})
              </h3>

              <Card>
                <Table
                  dataSource={selectedOrder.importOrderDetails}
                  columns={detailColumns}
                  rowKey="importOrderDetailId"
                  pagination={false}
                  size="middle"
                />
              </Card>
            </div>

            {/* Continue button */}
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <Button
                type="primary"
                size="large"
                disabled={selectedRowKeys.length === 0}
                onClick={handleContinue}
                style={{ minWidth: "200px" }}
              >
                Tiếp tục nhập thông tin phiếu xuất
                {selectedRowKeys.length > 0 && (
                  <span style={{ marginLeft: 8 }}>
                    ({selectedRowKeys.length} mặt hàng đã chọn)
                  </span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Empty
              description="Chọn một đơn nhập để tạo phiếu xuất trả nhà cung cấp"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>
    </div>
  );
};

UseExportFirstStep.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  initialSelectedOrder: PropTypes.object,
  initialSelectedItems: PropTypes.arrayOf(
    PropTypes.shape({
      importOrderDetailId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]).isRequired,
    })
  ),
};

export default UseExportFirstStep;
