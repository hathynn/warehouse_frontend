import React, { useState, useEffect } from "react";
import {
  Collapse,
  Button,
  Modal,
  Card,
  Tag,
  Spin,
  Typography,
  Row,
  Col,
  Empty,
  message,
  Space,
  Input,
} from "antd";
import {
  QrcodeOutlined,
  ExportOutlined,
  DownOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import QRCode from "react-qr-code";
import useExportRequestService from "@/services/useExportRequestService";
import useExportRequestDetailService from "@/services/useExportRequestDetailService";

const { Panel } = Collapse;
const { Title, Text } = Typography;

const QrCodeExport = () => {
  const [exportRequests, setExportRequests] = useState([]);
  const [exportDetails, setExportDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([]);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Services
  const { getAllExportRequests } = useExportRequestService();
  const { getExportRequestDetails } = useExportRequestDetailService();

  useEffect(() => {
    fetchExportRequests();
  }, []);

  const fetchExportRequests = async () => {
    try {
      setLoading(true);
      const response = await getAllExportRequests();

      if (response.statusCode === 200) {
        const inProgressRequests = response.content.filter(
          (request) =>
            request.status === "IN_PROGRESS" &&
            (request.type === "SELLING" || request.type === "INTERNAL")
        );
        setExportRequests(inProgressRequests);
      }
    } catch (error) {
      console.error("Error fetching export requests:", error);
      message.error("Không thể tải danh sách phiếu xuất");
    } finally {
      setLoading(false);
    }
  };

  const fetchExportDetails = async (exportRequestId) => {
    if (exportDetails[exportRequestId]) {
      return;
    }

    try {
      setDetailLoading((prev) => ({ ...prev, [exportRequestId]: true }));
      const response = await getExportRequestDetails(exportRequestId, 1, 50);

      if (response.content) {
        setExportDetails((prev) => ({
          ...prev,
          [exportRequestId]: response.content,
        }));
      }
    } catch (error) {
      console.error("Error fetching export details:", error);
      message.error("Không thể tải chi tiết phiếu xuất");
    } finally {
      setDetailLoading((prev) => ({ ...prev, [exportRequestId]: false }));
    }
  };

  const getTypeDisplay = (type) => {
    switch (type) {
      case "SELLING":
        return "Xuất bán";
      case "INTERNAL":
        return "Xuất nội bộ";
      default:
        return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "SELLING":
        return "green";
      case "INTERNAL":
        return "blue";
      default:
        return "default";
    }
  };

  const showQRModal = (inventoryItemIds, itemName) => {
    setSelectedInventoryItems(inventoryItemIds);
    setSelectedItemName(itemName);
    setModalVisible(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Filter export requests
  const filteredRequests = exportRequests.filter((request) =>
    request.exportRequestId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (exportRequests.length === 0) {
    return (
      <Card>
        <Empty description="Không có phiếu xuất đang xử lý" />
      </Card>
    );
  }

  return (
    <div className="p-6">
      <Card className="mb-6">
        <Title level={3}>
          <QrcodeOutlined className="mr-2 text-blue-500" />
          Tra cứu mã QR cho phiếu xuất
        </Title>
      </Card>

      <div className="mb-4">
        <Input
          placeholder="Tìm kiếm theo mã phiếu xuất..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="large"
        />
      </div>

      <Collapse
        expandIcon={({ isActive }) => (
          <DownOutlined rotate={isActive ? 180 : 0} />
        )}
        onChange={(keys) => {
          keys.forEach((key) => {
            fetchExportDetails(key);
          });
        }}
      >
        {filteredRequests.map((request) => (
          <Panel
            key={request.exportRequestId}
            header={
              <div className="flex justify-between items-center w-full">
                <Space>
                  <ExportOutlined className="text-blue-500" />
                  <Text strong>{request.exportRequestId}</Text>
                  <Tag color={getTypeColor(request.type)}>
                    {getTypeDisplay(request.type)}
                  </Tag>
                </Space>
              </div>
            }
          >
            <div className="mt-4">
              {detailLoading[request.exportRequestId] ? (
                <div className="text-center py-4">
                  <Spin />
                  <div>Đang tải...</div>
                </div>
              ) : exportDetails[request.exportRequestId]?.length > 0 ? (
                <div className="space-y-2">
                  {exportDetails[request.exportRequestId].map((detail) => (
                    <Card key={detail.exportRequestDetailId} size="small">
                      <div className="flex justify-between items-center">
                        <div>
                          <Text strong className="text-blue-600">
                            {detail.itemId}
                          </Text>
                          <br />
                          <Text>{detail.itemName}</Text>
                          <br />
                          <Tag>Số lượng: {detail.quantity}</Tag>
                          <Tag color="blue">
                            {detail.inventoryItemIds.length} mã QR
                          </Tag>
                        </div>
                        <Button
                          type="primary"
                          icon={<QrcodeOutlined />}
                          onClick={() =>
                            showQRModal(detail.inventoryItemIds, detail.itemId)
                          }
                          disabled={
                            !detail.inventoryItemIds ||
                            detail.inventoryItemIds.length === 0
                          }
                        >
                          Xem QR
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty description="Chưa có chi tiết sản phẩm" />
              )}
            </div>
          </Panel>
        ))}
      </Collapse>

      <Modal
        title={`Mã QR - ${selectedItemName}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
      >
        <Row gutter={[24, 24]} className="py-4">
          {selectedInventoryItems.map((itemId) => (
            <Col key={itemId} xs={24} sm={12} md={8} lg={6}>
              <Card
                size="small"
                className="text-center"
                style={{ margin: "8px 0" }}
              >
                <QRCode
                  value={itemId}
                  size={120}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
                <Text className="text-xs mt-2 block break-all">{itemId}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>
    </div>
  );
};

export default QrCodeExport;
