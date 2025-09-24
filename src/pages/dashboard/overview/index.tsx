import React, { useEffect, useState, useMemo } from "react";
import {
  InboxOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  TagsOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useInventoryItemService, { InventoryItemFigureResponse } from "../../../services/useInventoryItemService";
import useItemService, { ItemFiguresResponse } from "../../../services/useItemService";
import useStockCheckService, { StockCheckNumberResponse } from "../../../services/useStockCheckService";
import useExportRequestService, { ExportRequestNumberResponse } from "../../../services/useExportRequestService";
import useImportRequestService, { ImportRequestNumberResponse } from "../../../services/useImportRequestService";
import { useSelector } from "react-redux";
import { UserState } from "@/contexts/redux/features/userSlice";
import { AccountRole } from "@/utils/enums";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Select, DatePicker } from "antd";
import dayjs from "dayjs";
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

const { Option } = Select;

interface InventoryItemOverviewStats {
  fabric: {
    totalInventoryItemAvailable: number;
    totalInventoryItemUnAvailable: number;
    totalInventoryItemNeedLiquid: number;
    totalInventoryItemReadToStore: number;
    totalInventoryItemNoLongerExist: number;
  };
  accessories: {
    totalInventoryItemAvailable: number;
    totalInventoryItemUnAvailable: number;
    totalInventoryItemNeedLiquid: number;
    totalInventoryItemReadToStore: number;
    totalInventoryItemNoLongerExist: number;
  };
}

const SummaryOverview = () => {
  const userRole = useSelector((state: { user: UserState }) => state.user.role);
  const nav = useNavigate();

  // Services
  const { getInventoryItemFigure } = useInventoryItemService();
  const { getItemFigures } = useItemService();
  const { getStockCheckNumber } = useStockCheckService();
  const { getExportRequestNumber } = useExportRequestService();
  const { getImportRequestNumber } = useImportRequestService();

  // State
  const [inventoryItemFigure, setInventoryItemFigure] = useState<InventoryItemFigureResponse[]>([]);
  const [itemFigures, setItemFigures] = useState<ItemFiguresResponse | null>(null);
  const [stockCheckNumbers, setStockCheckNumbers] = useState<StockCheckNumberResponse | null>(null);
  const [exportRequestNumbers, setExportRequestNumbers] = useState<ExportRequestNumberResponse | null>(null);
  const [importRequestNumbers, setImportRequestNumbers] = useState<ImportRequestNumberResponse | null>(null);

  // Date filter state
  const [dateFilter, setDateFilter] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customDateRange, setCustomDateRange] = useState<[string, string] | null>(null);

  // Calculate date range based on filter
  const getDateRange = useMemo(() => {
    const now = new Date();
    let fromDate: string, toDate: string;

    switch (dateFilter) {
      case 'month': {
        fromDate = dayjs().startOf('month').format('YYYY-MM-DD');
        toDate = dayjs().format('YYYY-MM-DD');
        break;
      }
      case 'quarter': {
        const quarterStart = (selectedQuarter - 1) * 3;
        fromDate = dayjs().year(selectedYear).month(quarterStart).startOf('month').format('YYYY-MM-DD');
        toDate = dayjs().year(selectedYear).month(quarterStart + 2).endOf('month').format('YYYY-MM-DD');
        // Don't show future dates
        if (dayjs(toDate).isAfter(dayjs())) {
          toDate = dayjs().format('YYYY-MM-DD');
        }
        break;
      }
      case 'year': {
        fromDate = dayjs().year(selectedYear).startOf('year').format('YYYY-MM-DD');
        toDate = dayjs().year(selectedYear).endOf('year').format('YYYY-MM-DD');
        // Don't show future dates
        if (dayjs(toDate).isAfter(dayjs())) {
          toDate = dayjs().format('YYYY-MM-DD');
        }
        break;
      }
      case 'custom': {
        if (customDateRange) {
          fromDate = customDateRange[0];
          toDate = customDateRange[1];
        } else {
          fromDate = dayjs().startOf('month').format('YYYY-MM-DD');
          toDate = dayjs().format('YYYY-MM-DD');
        }
        break;
      }
      default: {
        fromDate = dayjs().startOf('month').format('YYYY-MM-DD');
        toDate = dayjs().format('YYYY-MM-DD');
      }
    }

    return { fromDate, toDate };
  }, [dateFilter, selectedQuarter, selectedYear, customDateRange]);

  // Fetch data functions
  const fetchInventoryItemFigure = async () => {
    try {
      const response = await getInventoryItemFigure();
      if (response.statusCode === 200) {
        setInventoryItemFigure(response.content);
      }
    } catch (error) {
      console.error('Error fetching inventory item figures:', error);
    }
  };

  const fetchItemFigures = async () => {
    try {
      const response = await getItemFigures();
      if (response.statusCode === 200) {
        setItemFigures(response.content);
      }
    } catch (error) {
      console.error('Error fetching item figures:', error);
    }
  };

  const fetchTimeBasedData = async (fromDate: string, toDate: string) => {
    try {
      // Fetch all time-based data in parallel
      const [stockCheckResponse, exportResponse, importResponse] = await Promise.all([
        getStockCheckNumber(fromDate, toDate),
        getExportRequestNumber(fromDate, toDate),
        getImportRequestNumber(fromDate, toDate)
      ]);

      if (stockCheckResponse.statusCode === 200) {
        setStockCheckNumbers(stockCheckResponse.content);
      }
      if (exportResponse.statusCode === 200) {
        setExportRequestNumbers(exportResponse.content);
      }
      if (importResponse.statusCode === 200) {
        setImportRequestNumbers(importResponse.content);
      }
    } catch (error) {
      console.error('Error fetching time-based data:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInventoryItemFigure();
    fetchItemFigures();
  }, []);

  // Reload time-based data when date range changes
  useEffect(() => {
    const { fromDate, toDate } = getDateRange;
    fetchTimeBasedData(fromDate, toDate);
  }, [getDateRange]);

  const inventoryItemOverviewStats = useMemo<InventoryItemOverviewStats>(() => {
    if (!inventoryItemFigure || inventoryItemFigure.length === 0) {
      return {
        fabric: {
          totalInventoryItemAvailable: 0,
          totalInventoryItemUnAvailable: 0,
          totalInventoryItemNeedLiquid: 0,
          totalInventoryItemReadToStore: 0,
          totalInventoryItemNoLongerExist: 0,
        },
        accessories: {
          totalInventoryItemAvailable: 0,
          totalInventoryItemUnAvailable: 0,
          totalInventoryItemNeedLiquid: 0,
          totalInventoryItemReadToStore: 0,
          totalInventoryItemNoLongerExist: 0,
        }
      };
    }

    return inventoryItemFigure.reduce((acc, item) => {
      const category = item.itemId.startsWith('VAI') ? 'fabric' : 'accessories';
      acc[category].totalInventoryItemAvailable += item.totalInventoryItemAvailable;
      acc[category].totalInventoryItemUnAvailable += item.totalInventoryItemUnAvailable;
      acc[category].totalInventoryItemNeedLiquid += item.totalInventoryItemNeedLiquid;
      acc[category].totalInventoryItemReadToStore += item.totalInventoryItemReadToStore;
      acc[category].totalInventoryItemNoLongerExist += item.totalInventoryItemNoLongerExist;
      return acc;
    }, {
      fabric: {
        totalInventoryItemAvailable: 0,
        totalInventoryItemUnAvailable: 0,
        totalInventoryItemNeedLiquid: 0,
        totalInventoryItemReadToStore: 0,
        totalInventoryItemNoLongerExist: 0,
      },
      accessories: {
        totalInventoryItemAvailable: 0,
        totalInventoryItemUnAvailable: 0,
        totalInventoryItemNeedLiquid: 0,
        totalInventoryItemReadToStore: 0,
        totalInventoryItemNoLongerExist: 0,
      }
    });
  }, [inventoryItemFigure]);

  const chartData = useMemo(() => {
    const totalFabric = Object.values(inventoryItemOverviewStats.fabric).reduce((a, b) => a + b, 0);
    const totalAccessories = Object.values(inventoryItemOverviewStats.accessories).reduce((a, b) => a + b, 0);
    const totalItems = totalFabric + totalAccessories;

    const categoryData = [
      {
        name: 'Hàng Vải',
        value: totalFabric,
        color: '#3b82f6',
        percentage: totalItems > 0 ? ((totalFabric / totalItems) * 100).toFixed(1) : '0'
      },
      {
        name: 'Phụ Liệu',
        value: totalAccessories,
        color: '#8b5cf6',
        percentage: totalItems > 0 ? ((totalAccessories / totalItems) * 100).toFixed(1) : '0'
      }
    ].filter(item => item.value > 0);

    return { categoryData };
  }, [inventoryItemOverviewStats]);

  // Get current years (no future years)
  const getCurrentYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year);
    }
    return years;
  };

  // Get quarters for selected year
  const getQuartersForYear = () => {
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

    if (selectedYear === currentYear) {
      // Only show quarters up to current quarter
      return Array.from({ length: currentQuarter }, (_, i) => i + 1);
    } else if (selectedYear < currentYear) {
      // Show all quarters for past years
      return [1, 2, 3, 4];
    }
    return []; // No quarters for future years (shouldn't happen)
  };

  // Summary Card Component
  const SummaryCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    subtitle: string;
  }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-6 shadow-lg border-0 transform hover:scale-105 transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 font-medium text-sm uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-white mb-2">
            {value.toLocaleString()}
          </p>
          <p className="text-white/70 text-xs">{subtitle}</p>
        </div>
        <div className="text-white/80 text-3xl">
          {icon}
        </div>
      </div>
    </div>
  );

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600">
            Số lượng: {data.value.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Tỷ lệ: {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Tổng Quan Kho Hàng
          </h1>
          <p className="text-lg text-slate-600">
            Quản lý và theo dõi toàn bộ hoạt động kho vải
          </p>
        </div>

        {/* Quick Actions */}
        {userRole === AccountRole.DEPARTMENT && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-center">
              <h2 className="text-xl font-semibold text-slate-800 mr-6">
                Thao tác nhanh:
              </h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => nav("/import/create-request")}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium 
                   hover:from-blue-600 hover:to-blue-700 cursor-pointer"
                >
                  Tạo phiếu nhập kho
                </button>
                <button
                  onClick={() => nav("/export/create-request")}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium 
                   hover:from-emerald-600 hover:to-emerald-700 cursor-pointer"
                >
                  Tạo phiếu xuất kho
                </button>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium 
                   hover:from-amber-600 hover:to-amber-700 cursor-pointer"
                >
                  Tạo phiếu kiểm tra tồn kho
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Time-based Analytics with Date Filter */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          {/* Date Filter Header */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarOutlined className="text-slate-600" />
                <span className="font-semibold text-slate-700 text-lg">Thống kê theo thời gian</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 ml-10">
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

                {dateFilter === 'quarter' && (
                  <>
                    <Select
                      value={selectedYear}
                      onChange={setSelectedYear}
                      className="min-w-[90px]"
                      size="middle"
                    >
                      {getCurrentYears().map(year => (
                        <Option key={year} value={year}>{year}</Option>
                      ))}
                    </Select>
                    <Select
                      value={selectedQuarter}
                      onChange={setSelectedQuarter}
                      className="min-w-[90px]"
                      size="middle"
                    >
                      {getQuartersForYear().map(quarter => (
                        <Option key={quarter} value={quarter}>Q{quarter}</Option>
                      ))}
                    </Select>
                  </>
                )}

                {dateFilter === 'year' && (
                  <Select
                    value={selectedYear}
                    onChange={setSelectedYear}
                    className="min-w-[90px]"
                    size="middle"
                  >
                    {getCurrentYears().map(year => (
                      <Option key={year} value={year}>{year}</Option>
                    ))}
                  </Select>
                )}

                {dateFilter === 'custom' && (
                  <ConfigProvider locale={viVN}>
                    <DatePicker.RangePicker
                      value={customDateRange ? [dayjs(customDateRange[0]), dayjs(customDateRange[1])] : null}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          setCustomDateRange([
                            dates[0].format('YYYY-MM-DD'),
                            dates[1].format('YYYY-MM-DD')
                          ]);
                        } else {
                          setCustomDateRange(null);
                        }
                      }}
                      disabledDate={(current) => current && current > dayjs().endOf('day')}
                      format="DD/MM/YYYY"
                      size="middle"
                      placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                    />
                  </ConfigProvider>
                )}
              </div>
            </div>

            {/* Date Range Display */}
            <div className="mt-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-sm text-slate-600 font-medium">
                Khoảng thời gian: {dayjs(getDateRange.fromDate).format('DD/MM/YYYY')} - {dayjs(getDateRange.toDate).format('DD/MM/YYYY')}
              </span>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Import Overview */}
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-800 border-l-4 border-purple-500 pl-3">
                Nhập kho
              </h4>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                    <ImportOutlined className="text-white" style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p className="font-medium text-amber-700">Đang xử lý</p>
                    <p className="text-xs text-amber-600">Phiếu nhập</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-600">
                  {importRequestNumbers?.numberOfOngoingImport || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircleOutlined className="text-white" style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700">Hoàn thành</p>
                    <p className="text-xs text-emerald-600">Phiếu nhập</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-emerald-600">
                  {importRequestNumbers?.numberOfFinishImport || 0}
                </span>
              </div>
            </div>

            {/* Export Overview */}
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-800 border-l-4 border-cyan-500 pl-3">
                Xuất kho
              </h4>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                    <ExportOutlined className="text-white" style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p className="font-medium text-amber-700">Đang xử lý</p>
                    <p className="text-xs text-amber-600">Phiếu xuất</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-600">
                  {exportRequestNumbers?.numberOfOngoingExport || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircleOutlined className="text-white" style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700">Hoàn thành</p>
                    <p className="text-xs text-emerald-600">Phiếu xuất</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-emerald-600">
                  {exportRequestNumbers?.numberOfFinishExport || 0}
                </span>
              </div>
            </div>

            {/* Stock Check Overview */}
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-800 border-l-4 border-amber-500 pl-3">
                Kiểm kho
              </h4>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                    <InboxOutlined className="text-white" style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p className="font-medium text-amber-700">Đang xử lý</p>
                    <p className="text-xs text-amber-600">Phiếu kiểm</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-600">
                  {stockCheckNumbers?.numberOfOngoingStockCheck || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircleOutlined className="text-white" style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700">Hoàn thành</p>
                    <p className="text-xs text-emerald-600">Phiếu kiểm</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-emerald-600">
                  {stockCheckNumbers?.numberOfFinishStockCheck || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="space-y-8">
          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Summary Cards */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-red-500 rounded-full mr-3"></div>
                Tổng quan sản phẩm
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <SummaryCard
                  title="TỒN KHO K/D AN TOÀN"
                  value={itemFigures?.totalInStock || 0}
                  icon={<CheckCircleOutlined />}
                  color="from-emerald-500 to-emerald-600"
                  subtitle="Có tồn kho khả dụng an toàn"
                />
                <SummaryCard
                  title="HẾT HÀNG"
                  value={itemFigures?.totalOutOfStock || 0}
                  icon={<ExportOutlined />}
                  color="from-red-500 to-red-600"
                  subtitle="Hết hàng tồn kho"
                />
              </div>

              {/* Dòng phân cách */}
              <div className="border-t border-slate-200 my-6"></div>

              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mr-3"></div>
                Tổng quan hàng tồn kho
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-1">
                <SummaryCard
                  title="TỔNG VẢI"
                  value={Object.values(inventoryItemOverviewStats.fabric).reduce((a, b) => a + b, 0)}
                  icon={<InboxOutlined />}
                  color="from-blue-500 to-blue-600"
                  subtitle="Tất cả trạng thái"
                />
                <SummaryCard
                  title="TỔNG PHỤ LIỆU"
                  value={Object.values(inventoryItemOverviewStats.accessories).reduce((a, b) => a + b, 0)}
                  icon={<TagsOutlined />}
                  color="from-purple-500 to-purple-600"
                  subtitle="Tất cả trạng thái"
                />
              </div>
            </div>

            {/* Category Distribution Chart */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
                Phân bố hàng tồn kho theo loại
              </h3>

              <div className="flex items-center justify-center gap-12 mt-13">
                {/* Pie Chart */}
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={280} height={280}>
                    <PieChart>
                      <Pie
                        data={chartData.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.categoryData.map((entry, index) => (
                          <Cell key={`category-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-6">
                  {chartData.categoryData.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div className="flex flex-col">
                        <div className="font-bold text-lg text-slate-800">{item.name}</div>
                        <div className="text-2xl font-bold text-slate-600 mb-1">{item.percentage}%</div>
                        <div className="text-sm text-slate-500">{item.value.toLocaleString()} sản phẩm</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Status Details Table - Simplified */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mr-3"></div>
              Chi tiết hàng tồn kho theo trạng thái
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Loại hàng</th>
                    <th className="text-center py-3 px-4 font-semibold text-emerald-700">Khả dụng</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        Hàng Vải
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-emerald-600 font-semibold">
                      {inventoryItemOverviewStats.fabric.totalInventoryItemAvailable.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4 text-slate-800 font-bold">
                      {Object.values(inventoryItemOverviewStats.fabric).reduce((a, b) => a + b, 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                        Phụ Liệu
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-emerald-600 font-semibold">
                      {inventoryItemOverviewStats.accessories.totalInventoryItemAvailable.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4 text-slate-800 font-bold">
                      {Object.values(inventoryItemOverviewStats.accessories).reduce((a, b) => a + b, 0).toLocaleString()}
                    </td>
                  </tr>
                  {/* <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                    <td className="py-3 px-4 text-slate-800">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-2"></div>
                        Tổng cộng
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-emerald-700 text-lg">
                      {(inventoryItemOverviewStats.fabric.totalInventoryItemAvailable +
                        inventoryItemOverviewStats.accessories.totalInventoryItemAvailable).toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4 text-slate-800 text-lg">
                      {(Object.values(inventoryItemOverviewStats.fabric).reduce((a, b) => a + b, 0) +
                        Object.values(inventoryItemOverviewStats.accessories).reduce((a, b) => a + b, 0)).toLocaleString()}
                    </td>
                  </tr> */}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryOverview;