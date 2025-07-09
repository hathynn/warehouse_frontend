import React, { useState } from "react";
import {
  Card,
  DatePicker,
  Row,
  Col,
  Statistic,
  Badge,
  Space,
  Typography,
  Select,
  Divider,
} from "antd";
import {
  ShoppingCartOutlined,
  InboxOutlined,
  ExportOutlined,
  ImportOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  TruckOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
  suffix?: string;
  change?: number | string;
};

const SummaryOverview = () => {
  const nav = useNavigate();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    [dayjs().subtract(7, "day"), dayjs()]
  );

  const mockData = {
    totalProducts: 1248,
    inStock: 1156,
    outOfStock: 92,
    lowStock: 45,
    importSlips: 15,
    importOrders: 23,
    exportSlips: 28,
    exportRequests: 34,
    importsInProgress: 8,
    importsStored: 15,
    exportsInProgress: 12,
    exportsCompleted: 22,
    activeStaff: 12,
  };

  const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    color,
    prefix = "",
    suffix = "",
    change,
  }) => (
    <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
            <Text type="secondary" className="text-sm font-medium">
              {title}
            </Text>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900">
              {prefix && <span className="text-lg">{prefix}</span>}
              {value?.toLocaleString()}
              {suffix && <span className="text-lg ml-1">{suffix}</span>}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="overflow-x-hidden ">
      <div className="mb-6 bg-blue-500 text-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-center-safe gap-4">
          <div className="flex items-center  gap-2">
            <span className="font-semibold text-white">Ngày:</span>

            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
            />
          </div>
          <Divider type="vertical" style={{ borderColor: "white" }} />

          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Khoảng thời gian:</span>

            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </div>
          <Divider type="vertical" style={{ borderColor: "white" }} />

          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Thao tác nhanh:</span>

            <Space wrap>
              <button
                onClick={() => nav("/import/create-request")}
                className="px-4 py-2 bg-white text-black  rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
              >
                Tạo phiếu nhập kho
              </button>
              <button
                onClick={() => nav("/export/create-request")}
                className="px-4 py-2 bg-white text-black  rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
              >
                Tạo phiếu xuất kho
              </button>
              <button className="px-4 py-2 bg-white text-black  rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                Kiểm tra tồn kho
              </button>
            </Space>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="space-y-6">
        <div>
          <Title level={4} className="mb-4 text-gray-700 font-semibold">
            📦 Tổng quan kho vải
          </Title>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Tổng sản phẩm"
                value={mockData.totalProducts}
                icon={<InboxOutlined className="text-xl" />}
                color="bg-blue-50 text-blue-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Còn hàng"
                value={mockData.inStock}
                icon={<CheckCircleOutlined className="text-xl" />}
                color="bg-green-50 text-green-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Hết hàng"
                value={mockData.outOfStock}
                icon={<AlertOutlined className="text-xl" />}
                color="bg-red-50 text-red-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Sắp hết hàng"
                value={mockData.lowStock}
                icon={<ClockCircleOutlined className="text-xl" />}
                color="bg-yellow-50 text-yellow-600"
              />
            </Col>
          </Row>
        </div>

        <div>
          <Title level={4} className="mb-4 text-gray-700 font-semibold">
            📥 Tổng quan nhập kho
          </Title>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Phiếu nhập"
                value={mockData.importSlips}
                icon={<ImportOutlined className="text-xl" />}
                color="bg-blue-50 text-blue-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Đơn nhập"
                value={mockData.importOrders}
                icon={<ShoppingCartOutlined className="text-xl" />}
                color="bg-purple-50 text-purple-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Đang xử lý"
                value={mockData.importsInProgress}
                icon={<ClockCircleOutlined className="text-xl" />}
                color="bg-orange-50 text-orange-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Đã nhập kho"
                value={mockData.importsStored}
                icon={<CheckCircleOutlined className="text-xl" />}
                color="bg-green-50 text-green-600"
              />
            </Col>
          </Row>
        </div>

        <div>
          <Title level={4} className="mb-4 text-gray-700 font-semibold">
            📤 Tổng quan xuất kho
          </Title>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Phiếu xuất"
                value={mockData.exportSlips}
                icon={<ExportOutlined className="text-xl" />}
                color="bg-indigo-50 text-indigo-600"
              />
            </Col>
     
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Đang xử lý"
                value={mockData.exportsInProgress}
                icon={<ClockCircleOutlined className="text-xl" />}
                color="bg-orange-50 text-orange-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Đã hoàn thành"
                value={mockData.exportsCompleted}
                icon={<CheckCircleOutlined className="text-xl" />}
                color="bg-green-50 text-green-600"
              />
            </Col>
          </Row>
        </div>

        <div>
          <Title level={4} className="mb-4 text-gray-700 font-semibold">
            👥 Tổng quan nhân sự
          </Title>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatCard
                title="Nhân viên hoạt động"
                value={mockData.activeStaff}
                icon={<TeamOutlined className="text-xl" />}
                color="bg-teal-50 text-teal-600"
              />
            </Col>
          </Row>
        </div>
      </div>

      {/* <div className="mt-8 bg-white p-4 rounded-lg shadow-sm">
        <Title level={5} className="mb-3">
          Thao tác nhanh
        </Title>
        <Space wrap>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Tạo đơn nhập kho
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Tạo đơn xuất kho
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Kiểm tra tồn kho
          </button>
        </Space>
      </div> */}
    </div>
  );
};

export default SummaryOverview;
