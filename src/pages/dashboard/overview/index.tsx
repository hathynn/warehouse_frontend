import React, { useEffect, useState, useMemo } from "react";
import { Row, Col, Space, Typography } from "antd";
import {
  ShoppingCartOutlined,
  InboxOutlined,
  ExportOutlined,
  ImportOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useInventoryItemService, { InventoryItemFigureResponse } from "../../../services/useInventoryItemService";
import StatisticCard from "../../../components/commons/StatisticCard";

const { Title } = Typography;
interface InventoryItemOverviewStats {
  totalProducts: number;
  totalInventoryItemAvailable: number;
  totalInventoryItemUnAvailable: number;
  totalInventoryItemNeedLiquid: number;
}

const SummaryOverview = () => {
  const nav = useNavigate();
  const { getInventoryItemFigure } = useInventoryItemService();
  const [inventoryItemFigure, setInventoryItemFigure] = useState<InventoryItemFigureResponse[]>([]);


  const fetchInventoryItemFigure = async () => {
    const inventoryItemFigureResponse = await getInventoryItemFigure();
    if (inventoryItemFigureResponse.statusCode === 200) {
      setInventoryItemFigure(inventoryItemFigureResponse.content);
    }
  };
  useEffect(() => {
    fetchInventoryItemFigure();
  }, []);

  const inventoryItemOverviewStats = useMemo<InventoryItemOverviewStats>(() => {
    if (!inventoryItemFigure || inventoryItemFigure.length === 0) {
      return {
        totalProducts: 0,
        totalInventoryItemAvailable: 0,
        totalInventoryItemUnAvailable: 0,
        totalInventoryItemNeedLiquid: 0,
      };
    }

    return inventoryItemFigure.reduce((acc, item) => {
      acc.totalProducts += item.totalInventoryItemAvailable + item.totalInventoryItemUnAvailable;
      acc.totalInventoryItemAvailable += item.totalInventoryItemAvailable;
      acc.totalInventoryItemUnAvailable += item.totalInventoryItemUnAvailable;
      acc.totalInventoryItemNeedLiquid += item.totalInventoryItemNeedLiquid;
      return acc;
    }, {
      totalProducts: 0,
      totalInventoryItemAvailable: 0,
      totalInventoryItemUnAvailable: 0,
      totalInventoryItemNeedLiquid: 0,
    });
  }, [inventoryItemFigure]);

  const mockData = {
    totalProducts: 1248,
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

  return (
    <div className="overflow-x-hidden ">
      <div className="mb-6 bg-blue-500 text-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-center-safe gap-4">
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
              <StatisticCard
                title="Tổng sản phẩm tồn kho"
                value={inventoryItemOverviewStats.totalProducts}
                icon={<InboxOutlined className="text-xl" />}
                color="bg-blue-50 text-blue-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatisticCard
                title="Khả dụng"
                value={inventoryItemOverviewStats.totalInventoryItemAvailable}
                icon={<CheckCircleOutlined className="text-xl" />}
                color="bg-green-50 text-green-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatisticCard
                title="Cần thanh lý"
                value={inventoryItemOverviewStats.totalInventoryItemNeedLiquid}
                icon={<ExclamationCircleOutlined className="text-xl" />}
                color="bg-red-50 text-red-600"
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
              <StatisticCard
                title="Phiếu nhập"
                value={mockData.importSlips}
                icon={<ImportOutlined className="text-xl" />}
                color="bg-blue-50 text-blue-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatisticCard
                title="Đơn nhập"
                value={mockData.importOrders}
                icon={<ShoppingCartOutlined className="text-xl" />}
                color="bg-purple-50 text-purple-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatisticCard
                title="Đang xử lý"
                value={mockData.importsInProgress}
                icon={<ClockCircleOutlined className="text-xl" />}
                color="bg-orange-50 text-orange-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatisticCard
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
              <StatisticCard
                title="Phiếu xuất"
                value={mockData.exportSlips}
                icon={<ExportOutlined className="text-xl" />}
                color="bg-indigo-50 text-indigo-600"
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <StatisticCard
                title="Đang xử lý"
                value={mockData.exportsInProgress}
                icon={<ClockCircleOutlined className="text-xl" />}
                color="bg-orange-50 text-orange-600"
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <StatisticCard
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
              <StatisticCard
                title="Nhân viên hoạt động"
                value={mockData.activeStaff}
                icon={<TeamOutlined className="text-xl" />}
                color="bg-teal-50 text-teal-600"
              />
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default SummaryOverview;
