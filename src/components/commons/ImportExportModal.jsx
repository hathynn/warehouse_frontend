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
  Select,
  DatePicker,
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
  CalendarOutlined,
} from "@ant-design/icons";
import PropTypes from "prop-types";
import useItemService from "@/services/useItemService";
import dayjs from "dayjs";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { useMemo } from "react";

const { Option } = Select;

const { Panel } = Collapse;
const { Text } = Typography;

const ImportExportModal = ({ visible, onClose, itemId, item }) => {
  const [loading, setLoading] = useState(false);
  const [importExportData, setImportExportData] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [dateFilter, setDateFilter] = useState("month");
  const [selectedQuarter, setSelectedQuarter] = useState(
    Math.ceil((new Date().getMonth() + 1) / 3)
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customDateRange, setCustomDateRange] = useState(null);

  const { getItemImportExportNumber } = useItemService();

  const fetchImportExportData = async (fromDate = null, toDate = null) => {
    if (!itemId) return;

    try {
      setLoading(true);

      // Sử dụng dates từ parameter hoặc fallback to default
      const finalFromDate =
        fromDate || dayjs().startOf("month").format("YYYY-MM-DD");
      const finalToDate = toDate || dayjs().format("YYYY-MM-DD");

      const response = await getItemImportExportNumber(
        itemId,
        finalFromDate,
        finalToDate
      );

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

  // Thêm useMemo để tính date range
  const getDateRange = useMemo(() => {
    let fromDate, toDate;

    switch (dateFilter) {
      case "month": {
        fromDate = dayjs().startOf("month").format("YYYY-MM-DD");
        toDate = dayjs().format("YYYY-MM-DD");
        break;
      }
      case "quarter": {
        const quarterStart = (selectedQuarter - 1) * 3;
        fromDate = dayjs()
          .year(selectedYear)
          .month(quarterStart)
          .startOf("month")
          .format("YYYY-MM-DD");
        toDate = dayjs()
          .year(selectedYear)
          .month(quarterStart + 2)
          .endOf("month")
          .format("YYYY-MM-DD");
        if (dayjs(toDate).isAfter(dayjs())) {
          toDate = dayjs().format("YYYY-MM-DD");
        }
        break;
      }
      case "year": {
        fromDate = dayjs()
          .year(selectedYear)
          .startOf("year")
          .format("YYYY-MM-DD");
        toDate = dayjs().year(selectedYear).endOf("year").format("YYYY-MM-DD");
        if (dayjs(toDate).isAfter(dayjs())) {
          toDate = dayjs().format("YYYY-MM-DD");
        }
        break;
      }
      case "custom": {
        if (customDateRange) {
          fromDate = customDateRange[0];
          toDate = customDateRange[1];
        } else {
          fromDate = dayjs().startOf("month").format("YYYY-MM-DD");
          toDate = dayjs().format("YYYY-MM-DD");
        }
        break;
      }
      default: {
        fromDate = dayjs().startOf("month").format("YYYY-MM-DD");
        toDate = dayjs().format("YYYY-MM-DD");
      }
    }

    return { fromDate, toDate };
  }, [dateFilter, selectedQuarter, selectedYear, customDateRange]);

  useEffect(() => {
    if (visible && itemId) {
      const { fromDate, toDate } = getDateRange;
      fetchImportExportData(fromDate, toDate);
    }
  }, [visible, itemId]);

  // Thêm useEffect mới để reload khi date thay đổi
  useEffect(() => {
    if (visible && itemId) {
      const { fromDate, toDate } = getDateRange;
      fetchImportExportData(fromDate, toDate);
    }
  }, [getDateRange, visible, itemId]);

  // Helper functions
  const getCurrentYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year);
    }
    return years;
  };

  const getQuartersForYear = () => {
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

    if (selectedYear === currentYear) {
      return Array.from({ length: currentQuarter }, (_, i) => i + 1);
    } else if (selectedYear < currentYear) {
      return [1, 2, 3, 4];
    }
    return [];
  };

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
            <span style={{ fontSize: "20px" }}>
              Báo cáo xuất nhập kho - {item?.name}
            </span>
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
      {/* Thêm Date Filter Section */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-slate-600" />
            <span className="font-semibold text-slate-700 text-lg">
              Thống kê theo thời gian
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={dateFilter}
              onChange={setDateFilter}
              className="min-w-[130px]"
              size="middle"
            >
              <Option value="month">Tháng hiện tại</Option>
              <Option value="quarter">Theo quý</Option>
              <Option value="year">Theo năm</Option>
              <Option value="custom">Tùy chọn</Option>
            </Select>

            {dateFilter === "quarter" && (
              <>
                <Select
                  value={selectedYear}
                  onChange={setSelectedYear}
                  className="min-w-[90px]"
                  size="middle"
                >
                  {getCurrentYears().map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
                <Select
                  value={selectedQuarter}
                  onChange={setSelectedQuarter}
                  className="min-w-[90px]"
                  size="middle"
                >
                  {getQuartersForYear().map((quarter) => (
                    <Option key={quarter} value={quarter}>
                      Q{quarter}
                    </Option>
                  ))}
                </Select>
              </>
            )}

            {dateFilter === "year" && (
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                className="min-w-[90px]"
                size="middle"
              >
                {getCurrentYears().map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            )}

            {dateFilter === "custom" && (
              <ConfigProvider locale={viVN}>
                <DatePicker.RangePicker
                  value={
                    customDateRange
                      ? [dayjs(customDateRange[0]), dayjs(customDateRange[1])]
                      : null
                  }
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setCustomDateRange([
                        dates[0].format("YYYY-MM-DD"),
                        dates[1].format("YYYY-MM-DD"),
                      ]);
                    } else {
                      setCustomDateRange(null);
                    }
                  }}
                  // disabledDate={(current) =>
                  //   current && current > dayjs().endOf("day")
                  // }
                  format="DD/MM/YYYY"
                  size="middle"
                  placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                />
              </ConfigProvider>
            )}
          </div>
        </div>

        {/* Date Range Display */}
        <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-sm text-slate-600 font-medium">
            Khoảng thời gian:{" "}
            {dayjs(getDateRange.fromDate).format("DD/MM/YYYY")} -{" "}
            {dayjs(getDateRange.toDate).format("DD/MM/YYYY")}
          </span>
        </div>
      </div>

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
