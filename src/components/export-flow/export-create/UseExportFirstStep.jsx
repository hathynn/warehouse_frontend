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
import useImportRequestService from "@/services/useImportRequestService";
import PropTypes from "prop-types";
import useProviderService from "@/services/useProviderService";
import { Package, Calendar, Clock, Hash, Building2 } from "lucide-react";
import { Input, Select, Dropdown, Space } from "antd";
import { Search, SortAsc, SortDesc, ChevronDown } from "lucide-react";

const checkboxStyle = `
  .custom-table .ant-checkbox-inner {
    border-width: 2.5px !important;
  }
  .custom-table .ant-checkbox-checked .ant-checkbox-inner {
    border-width: 2.5px !important;
  }
  .custom-table .ant-checkbox:hover .ant-checkbox-inner {
    border-width: 2.5px !important;
  }
`;

const UseExportFirstStep = ({
  onConfirm,
  initialSelectedOrder,
  initialSelectedItems,
}) => {
  const { getAllImportOrders, loading } = useImportOrderService();
  const { getImportRequestById } = useImportRequestService();
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
  const [providerData, setProviderData] = useState({});
  const { getProviderById } = useProviderService();
  const [providerInfo, setProviderInfo] = useState({});
  const [searchField, setSearchField] = useState("importOrderId");
  const [searchValue, setSearchValue] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = mới nhất, asc = cũ nhất
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Handle select all checkbox
  const handleCheckAllChange = (e) => {
    const checked = e.target.checked;
    setCheckAll(checked);
    if (checked && selectedOrder) {
      // Chỉ lấy các detail có actualQuantity > 0
      const allKeys = selectedOrder.importOrderDetails
        .filter((detail) => detail.actualQuantity > 0)
        .map((detail) => detail.importOrderDetailId);
      setSelectedRowKeys(allKeys);
    } else {
      setSelectedRowKeys([]);
    }
  };

  useEffect(() => {
    fetchImportOrders();
  }, []);

  useEffect(() => {
    if (
      selectedOrder &&
      initialSelectedItems &&
      initialSelectedItems.length > 0
    ) {
      const initialKeys = initialSelectedItems.map(
        (item) => item.importOrderDetailId
      );

      setSelectedRowKeys(initialKeys);

      if (selectedOrder.importOrderDetails) {
        // ✅ THAY ĐỔI: Chỉ tính các detail có actualQuantity > 0
        const allKeys = selectedOrder.importOrderDetails
          .filter((detail) => detail.actualQuantity > 0)
          .map((d) => d.importOrderDetailId);
        setCheckAll(
          initialKeys.length === allKeys.length && initialKeys.length > 0
        );
      }
    } else if (
      selectedOrder &&
      (!initialSelectedItems || initialSelectedItems.length === 0)
    ) {
      setSelectedRowKeys([]);
      setCheckAll(false);
    }
  }, [selectedOrder, initialSelectedItems]);

  useEffect(() => {
    const fetchProviderData = async () => {
      if (selectedOrder && selectedOrder.importRequestId) {
        // Kiểm tra cache trước
        if (providerData[selectedOrder.importRequestId]) {
          const providerId = providerData[selectedOrder.importRequestId];

          // Fetch thông tin provider nếu chưa có
          if (providerId && !providerInfo[providerId]) {
            try {
              const providerResponse = await getProviderById(providerId);
              setProviderInfo((prev) => ({
                ...prev,
                [providerId]: providerResponse?.content || null,
              }));
            } catch (error) {
              console.error("Error fetching provider info:", error);
            }
          }
          return;
        }

        try {
          const importRequestResponse = await getImportRequestById(
            selectedOrder.importRequestId
          );
          const providerId = importRequestResponse?.content?.providerId || null;

          // Lưu vào cache
          setProviderData((prev) => ({
            ...prev,
            [selectedOrder.importRequestId]: providerId,
          }));

          // Fetch thông tin provider
          if (providerId) {
            try {
              const providerResponse = await getProviderById(providerId);
              setProviderInfo((prev) => ({
                ...prev,
                [providerId]: providerResponse?.content || null,
              }));
            } catch (error) {
              console.error("Error fetching provider info:", error);
            }
          }
        } catch (error) {
          console.error("Error fetching provider data:", error);
        }
      }
    };

    fetchProviderData();
  }, [selectedOrder?.importRequestId]);

  useEffect(() => {
    let filtered = [...importOrders];

    // Apply search filter
    if (searchValue.trim()) {
      filtered = filtered.filter((order) => {
        const searchLower = searchValue.toLowerCase().trim();

        switch (searchField) {
          case "importOrderId":
            return order.importOrderId.toLowerCase().includes(searchLower);
          case "importRequestId":
            return order.importRequestId.toLowerCase().includes(searchLower);
          case "itemId":
            return order.importOrderDetails.some((detail) =>
              detail.itemId.toLowerCase().includes(searchLower)
            );
          case "itemName":
            return order.importOrderDetails.some((detail) =>
              detail.itemName.toLowerCase().includes(searchLower)
            );
          default:
            return true;
        }
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.actualDateReceived}T${a.actualTimeReceived}`);
      const dateB = new Date(`${b.actualDateReceived}T${b.actualTimeReceived}`);

      if (sortOrder === "desc") {
        return dateB - dateA; // Mới nhất trước
      } else {
        return dateA - dateB; // Cũ nhất trước
      }
    });

    setFilteredOrders(filtered);
  }, [importOrders, searchValue, searchField, sortOrder]);

  const fetchImportOrders = async () => {
    try {
      setError(null);
      const response = await getAllImportOrders();
      if (response?.content) {
        // Lọc các đơn có status COMPLETED VÀ exportRequestId === null
        const completedOrders = response.content.filter(
          (order) =>
            order.status === "COMPLETED" && order.exportRequestId === null
        );

        // Lọc bỏ các đơn có tất cả actualQuantity = 0
        const validOrders = completedOrders.filter((order) => {
          return order.importOrderDetails.some(
            (detail) => detail.actualQuantity > 0
          );
        });

        setImportOrders(validOrders);
      }
    } catch (err) {
      setError("Không thể tải danh sách đơn nhập");
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      LACK: { color: "warning", text: "Thiếu" },
      EXCESS: { color: "processing", text: "Thừa" },
      MATCH: { color: "success", text: "Đủ" },
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
      const providerId = providerData[selectedOrder.importRequestId] || null;
      const currentProviderInfo = providerId ? providerInfo[providerId] : null;

      // ✅ FORMAT đầy đủ thông tin provider
      const formattedProviderInfo = currentProviderInfo
        ? {
            id: providerId,
            name: currentProviderInfo.name,
            phone: currentProviderInfo.phone || "", // ✅ THÊM phone
            address: currentProviderInfo.address || "", // ✅ THÊM address
          }
        : null;

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
        providerId: providerId,
        providerInfo: formattedProviderInfo, // ✅ Bây giờ đã có phone và address
      });
    }
  };

  const handleSelectOrder = (order) => {
    // Reset selection khi chuyển đơn khác
    if (!initialSelectedItems || initialSelectedItems.length === 0) {
      setSelectedRowKeys([]);
      setCheckAll(false);
    }
    setSelectedOrder(order);
  };

  // Columns cho bảng chi tiết
  const detailColumns = [
    {
      title: (
        <Checkbox
          checked={checkAll}
          onChange={handleCheckAllChange}
          disabled={
            !selectedOrder ||
            selectedOrder.importOrderDetails.filter(
              (detail) => detail.actualQuantity > 0
            ).length === 0
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

            setSelectedRowKeys(newSelectedKeys);

            // ✅ THAY ĐỔI: Chỉ tính các detail có actualQuantity > 0
            if (selectedOrder && selectedOrder.importOrderDetails) {
              const allKeys = selectedOrder.importOrderDetails
                .filter((detail) => detail.actualQuantity > 0)
                .map((d) => d.importOrderDetailId);
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
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      width: "15%",
    },
    {
      title: "Tên sản phẩm",
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

  // 4. Component thanh search và sort (thêm sau header "Đơn nhập hoàn tất")
  const SearchAndSortBar = (
    <div
      style={{
        padding: "12px 20px",
        borderBottom: "1px solid #f0f0f0",
        backgroundColor: "#fafafa",
      }}
    >
      <Space.Compact style={{ width: "100%" }}>
        <Select
          value={searchField}
          onChange={setSearchField}
          style={{ width: "35%" }}
          options={[
            { value: "importOrderId", label: "Mã đơn nhập" },
            { value: "importRequestId", label: "Mã phiếu nhập" },
            { value: "itemId", label: "Mã sản phẩm" },
            { value: "itemName", label: "Tên sản phẩm" },
          ]}
        />
        <Input
          placeholder={`Tìm kiếm...`}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          prefix={<Search size={16} style={{ color: "#8c8c8c" }} />}
          allowClear
          style={{ flex: 1 }}
        />
      </Space.Compact>

      <Dropdown
        trigger={["click"]}
        placement="bottomRight"
        menu={{
          items: [
            {
              key: "desc",
              label: "Ngày giờ nhận mới nhất trước",
              icon: <SortDesc size={16} />,
              onClick: () => setSortOrder("desc"),
            },
            {
              key: "asc",
              label: "Ngày giờ nhận cũ nhất trước",
              icon: <SortAsc size={16} />,
              onClick: () => setSortOrder("asc"),
            },
          ],
          selectedKeys: [sortOrder],
        }}
      >
        <Button
          style={{
            marginTop: "8px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Space>
            {sortOrder === "desc" ? (
              <SortDesc size={16} />
            ) : (
              <SortAsc size={16} />
            )}
            <span>
              {sortOrder === "desc"
                ? "Ngày giờ nhận mới nhất trước"
                : "Ngày giờ nhận cũ nhất trước"}
            </span>
          </Space>
          <ChevronDown size={16} />
        </Button>
      </Dropdown>
    </div>
  );

  return (
    <div
      className="h-[66vh]"
      style={{ display: "flex", backgroundColor: "#f5f5f5" }}
    >
      <style>{checkboxStyle}</style>
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
            Tổng số: {filteredOrders.length} / {importOrders.length} đơn
          </p>
        </div>

        {/* Thêm thanh Search và Sort ở đây */}
        {SearchAndSortBar}

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
          ) : filteredOrders.length === 0 ? (
            <Empty
              description={
                searchValue.trim()
                  ? "Không tìm thấy đơn nhập phù hợp"
                  : "Không có đơn nhập nào đã hoàn tất"
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div>
              {filteredOrders.map((order) => (
                <Card
                  key={order.importOrderId}
                  hoverable
                  // onClick={() => setSelectedOrder(order)}
                  onClick={() => handleSelectOrder(order)}
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
                    <Tag>
                      {
                        order.importOrderDetails.filter(
                          (detail) => detail.actualQuantity > 0
                        ).length
                      }{" "}
                      mặt hàng
                    </Tag>
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
                  {" "}
                  {/* ✅ THAY ĐỔI: từ span={8} thành span={6} */}
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
                  {" "}
                  {/* ✅ THAY ĐỔI: từ span={8} thành span={6} */}
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
                  {" "}
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
                <Col span={10}>
                  {" "}
                  {/* ✅ THÊM: Cột nhà cung cấp */}
                  <div className="mt-6">
                    <p
                      style={{
                        color: "#8c8c8c",
                        marginBottom: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <Building2
                        size={14}
                        style={{ marginRight: "4px", verticalAlign: "middle" }}
                      />
                      Nhà cung cấp
                    </p>
                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        margin: 0,
                      }}
                    >
                      {(() => {
                        const providerId =
                          providerData[selectedOrder.importRequestId];
                        const provider = providerId
                          ? providerInfo[providerId]
                          : null;
                        return provider ? provider.name : "Đang tải...";
                      })()}
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
                Chi tiết mặt hàng (
                {
                  selectedOrder.importOrderDetails.filter(
                    (detail) => detail.actualQuantity > 0
                  ).length
                }
                )
              </h3>

              <Card>
                <Table
                  className="custom-table"
                  dataSource={selectedOrder.importOrderDetails.filter(
                    (detail) => detail.actualQuantity > 0
                  )}
                  columns={detailColumns}
                  rowKey="importOrderDetailId"
                  pagination={false}
                  size="middle"
                />
              </Card>
            </div>

            {/* Continue button */}
            <div
              style={{
                textAlign: "center",
              }}
            >
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
