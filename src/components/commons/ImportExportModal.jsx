import React, { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Statistic,
  Row,
  Col,
  Spin,
  message,
  Tag,
  Collapse,
  List,
  Typography,
  Progress,
  Tooltip,
  Empty,
  Button,
  Popover,
} from "antd";
import {
  //   RiseOutlined,
  BarChartOutlined,
  ImportOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import useItemService from "@/services/useItemService";

const { Panel } = Collapse;
const { Text } = Typography;

const ImportExportModal = ({ visible, onClose, itemId, item }) => {
  const [loading, setLoading] = useState(false);
  const [importExportData, setImportExportData] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const { getItemImportExportNumber } = useItemService();

  const fetchImportExportData = async () => {
    if (!itemId) return;

    try {
      setLoading(true);
      const response = await getItemImportExportNumber(itemId);

      if (response && response.content) {
        setImportExportData(response.content);
      }
    } catch (error) {
      message.error("Không thể tải thông tin xuất nhập kho");
      console.error("Error fetching import-export data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && itemId) {
      fetchImportExportData();
    }
  }, [visible, itemId]);

  const calculateInventoryBalance = () => {
    if (!importExportData) return 0;
    return (
      importExportData.importMeasurementValue -
      importExportData.exportMeasurementValue
    );
  };

  const calculateUtilizationRate = () => {
    if (!importExportData || importExportData.importMeasurementValue === 0)
      return 0;
    return (
      (importExportData.exportMeasurementValue /
        importExportData.importMeasurementValue) *
      100
    ).toFixed(1);
  };

  const formatOrderId = (id) => {
    if (id.length > 15) {
      return `${id.substring(0, 8)}...${id.substring(id.length - 4)}`;
    }
    return id;
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    message.success("Đã sao chép mã đơn hàng!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const infoContent = (
    <div className="space-y-2 max-w-xs">
      <Text className="text-sm block">
        • Tồn kho = Tổng nhập (
        {importExportData?.importMeasurementValue.toLocaleString() || 0}) - Tổng
        xuất ({importExportData?.exportMeasurementValue.toLocaleString() || 0})
      </Text>
      <Text className="text-sm block">
        • Dữ liệu được cập nhật theo thời gian thực
      </Text>
      <Text className="text-sm block">
        • Nhấn nút sao chép để lưu mã đơn hàng đầy đủ
      </Text>
    </div>
  );

  return (
    <Modal
      title={
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <BarChartOutlined className="text-blue-600 text-xl" />
            <span>Báo cáo xuất nhập kho - {item?.name}</span>
          </div>
          <Popover content={infoContent} title="Thông tin" trigger="click">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              className="text-gray-400 hover:text-blue-600"
            />
          </Popover>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      {loading ? (
        <div className="flex flex-col justify-center items-center py-16">
          <Spin size="large" />
          <Text type="secondary" className="mt-4">
            Đang tải dữ liệu...
          </Text>
        </div>
      ) : importExportData ? (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <Row gutter={16}>
            <Col span={8}>
              <Card className="bg-green-50 border-green-200">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <ImportOutlined className="text-green-600" />
                      <span>Tổng nhập kho</span>
                    </div>
                  }
                  value={`${importExportData.importMeasurementValue} ${item?.measurementUnit}`}
                  valueStyle={{
                    color: "#52c41a",
                    fontSize: "20px",
                    fontWeight: "600",
                  }}
                />
              </Card>
            </Col>

            <Col span={8}>
              <Card className="bg-red-50 border-red-200">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <ExportOutlined className="text-red-600" />
                      <span>Tổng xuất kho</span>
                    </div>
                  }
                  value={`${importExportData.exportMeasurementValue} ${item?.measurementUnit}`}
                  valueStyle={{
                    color: "#ff4d4f",
                    fontSize: "20px",
                    fontWeight: "600",
                  }}
                />
              </Card>
            </Col>

            <Col span={8}>
              <Card className="bg-blue-50 border-blue-200">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <DatabaseOutlined className="text-blue-600" />
                      <span>Tồn kho hiện tại</span>
                    </div>
                  }
                  value={`${calculateInventoryBalance()} ${
                    item?.measurementUnit
                  }`}
                  valueStyle={{
                    color:
                      calculateInventoryBalance() >= 0 ? "#1890ff" : "#ff4d4f",
                    fontSize: "20px",
                    fontWeight: "600",
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Utilization Rate */}
          <Card title="Tỷ lệ xuất/nhập" size="small">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Text>Tỷ lệ sử dụng:</Text>
                <Text strong className="text-lg">
                  {calculateUtilizationRate()}%
                </Text>
              </div>
              <Progress
                percent={parseFloat(calculateUtilizationRate())}
                strokeColor={{
                  "0%": "#52c41a",
                  "100%": "#ff4d4f",
                }}
                showInfo={false}
              />
            </div>
          </Card>

          {/* Order Lists */}
          <Collapse
            defaultActiveKey={[]}
            className="bg-white"
            expandIconPosition="end"
          >
            <Panel
              header={
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-2">
                    <ImportOutlined className="text-green-600" />
                    <span>Danh sách đơn nhập kho</span>
                  </div>
                  <Tag color="green">
                    {importExportData.importOrderIds.length} đơn
                  </Tag>
                </div>
              }
              key="import"
            >
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {" "}
                {/* Thêm wrapper div này */}
                {importExportData.importOrderIds.length > 0 ? (
                  <List
                    size="small"
                    dataSource={importExportData.importOrderIds}
                    renderItem={(orderId, index) => (
                      <List.Item
                        className="hover:bg-gray-50 px-2 py-3"
                        actions={[
                          <Tooltip
                            key="copy-action"
                            title={
                              copiedId === orderId
                                ? "Đã sao chép!"
                                : "Sao chép mã đầy đủ"
                            }
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={
                                copiedId === orderId ? (
                                  <CheckCircleOutlined />
                                ) : (
                                  <CopyOutlined />
                                )
                              }
                              onClick={() => handleCopyId(orderId)}
                              className={
                                copiedId === orderId
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }
                            >
                              Sao chép
                            </Button>
                          </Tooltip>,
                        ]}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-green-600 font-medium">
                            {index + 1}.
                          </span>
                          <Text code className="bg-green-50">
                            {formatOrderId(orderId)}
                          </Text>
                        </div>
                      </List.Item>
                    )}
                    // Bỏ className="max-h-60 overflow-y-auto" ở đây
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có đơn nhập kho nào"
                  />
                )}
              </div>
            </Panel>

            <Panel
              header={
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-2">
                    <ExportOutlined className="text-red-600" />
                    <span>Danh sách đơn xuất kho</span>
                  </div>
                  <Tag color="red">
                    {importExportData.exportRequestIds.length} đơn
                  </Tag>
                </div>
              }
              key="export"
            >
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {" "}
                {/* Thêm wrapper div này */}
                {importExportData.exportRequestIds.length > 0 ? (
                  <List
                    size="small"
                    dataSource={importExportData.exportRequestIds}
                    renderItem={(requestId, index) => (
                      <List.Item
                        className="hover:bg-gray-50 px-2 py-3"
                        actions={[
                          <Tooltip
                            key="copy-action"
                            title={
                              copiedId === requestId
                                ? "Đã sao chép!"
                                : "Sao chép mã đầy đủ"
                            }
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={
                                copiedId === requestId ? (
                                  <CheckCircleOutlined />
                                ) : (
                                  <CopyOutlined />
                                )
                              }
                              onClick={() => handleCopyId(requestId)}
                              className={
                                copiedId === requestId
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }
                            >
                              Sao chép
                            </Button>
                          </Tooltip>,
                        ]}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-red-600 font-medium">
                            {index + 1}.
                          </span>
                          <Text code className="bg-red-50">
                            {formatOrderId(requestId)}
                          </Text>
                        </div>
                      </List.Item>
                    )}
                    // Bỏ className="max-h-60 overflow-y-auto" ở đây
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có đơn xuất kho nào"
                  />
                )}
              </div>
            </Panel>
          </Collapse>
        </div>
      ) : (
        <Empty description="Không có dữ liệu xuất nhập kho" className="py-16" />
      )}
    </Modal>
  );
};

ImportExportModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  itemId: PropTypes.string,
  item: PropTypes.shape({
    name: PropTypes.string,
    measurementUnit: PropTypes.string,
  }),
};

ImportExportModal.defaultProps = {
  visible: false,
  onClose: () => {},
  itemId: null,
  item: null,
};

export default ImportExportModal;
