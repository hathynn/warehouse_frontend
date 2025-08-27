import React, { useEffect, useState, useMemo } from "react";
import {
  ShoppingCartOutlined,
  InboxOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useInventoryItemService, { InventoryItemFigureResponse } from "../../../services/useInventoryItemService";
import { useSelector } from "react-redux";
import { UserState } from "@/contexts/redux/features/userSlice";
import { AccountRole } from "@/utils/enums";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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

  const chartData = useMemo(() => {
    const statusColors = {
      'Khả dụng': '#10b981',
      'Chuẩn bị xuất': '#f59e0b',
      'Thanh lý': '#ef4444',
      'Đang nhập kho': '#3b82f6',
      'Không tồn tại': '#6b7280'
    };

    const fabricData = [
      { name: 'Khả dụng', value: inventoryItemOverviewStats.fabric.totalInventoryItemAvailable, color: statusColors['Khả dụng'] },
      { name: 'Chuẩn bị xuất', value: inventoryItemOverviewStats.fabric.totalInventoryItemUnAvailable, color: statusColors['Chuẩn bị xuất'] },
      { name: 'Thanh lý', value: inventoryItemOverviewStats.fabric.totalInventoryItemNeedLiquid, color: statusColors['Thanh lý'] },
      { name: 'Đang nhập kho', value: inventoryItemOverviewStats.fabric.totalInventoryItemReadToStore, color: statusColors['Đang nhập kho'] },
      { name: 'Không tồn tại', value: inventoryItemOverviewStats.fabric.totalInventoryItemNoLongerExist, color: statusColors['Không tồn tại'] }
    ].filter(item => item.value > 0);

    const accessoriesData = [
      { name: 'Khả dụng', value: inventoryItemOverviewStats.accessories.totalInventoryItemAvailable, color: statusColors['Khả dụng'] },
      { name: 'Chuẩn bị xuất', value: inventoryItemOverviewStats.accessories.totalInventoryItemUnAvailable, color: statusColors['Chuẩn bị xuất'] },
      { name: 'Thanh lý', value: inventoryItemOverviewStats.accessories.totalInventoryItemNeedLiquid, color: statusColors['Thanh lý'] },
      { name: 'Đang nhập kho', value: inventoryItemOverviewStats.accessories.totalInventoryItemReadToStore, color: statusColors['Đang nhập kho'] },
      { name: 'Không tồn tại', value: inventoryItemOverviewStats.accessories.totalInventoryItemNoLongerExist, color: statusColors['Không tồn tại'] }
    ].filter(item => item.value > 0);

    const comparisonData = [
      {
        category: 'Vải',
        'Khả dụng': inventoryItemOverviewStats.fabric.totalInventoryItemAvailable,
        'Chuẩn bị xuất': inventoryItemOverviewStats.fabric.totalInventoryItemUnAvailable,
        'Thanh lý': inventoryItemOverviewStats.fabric.totalInventoryItemNeedLiquid,
        'Đang nhập kho': inventoryItemOverviewStats.fabric.totalInventoryItemReadToStore,
        'Không tồn tại': inventoryItemOverviewStats.fabric.totalInventoryItemNoLongerExist,
      },
      {
        category: 'Phụ liệu',
        'Khả dụng': inventoryItemOverviewStats.accessories.totalInventoryItemAvailable,
        'Chuẩn bị xuất': inventoryItemOverviewStats.accessories.totalInventoryItemUnAvailable,
        'Thanh lý': inventoryItemOverviewStats.accessories.totalInventoryItemNeedLiquid,
        'Đang nhập kho': inventoryItemOverviewStats.accessories.totalInventoryItemReadToStore,
        'Không tồn tại': inventoryItemOverviewStats.accessories.totalInventoryItemNoLongerExist,
      }
    ];

    return { fabricData, accessoriesData, comparisonData, statusColors };
  }, [inventoryItemOverviewStats]);

  // Component cho Summary Cards
  const SummaryCard = ({ title, value, icon, color, subtitle }) => (
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

  // Custom Tooltip cho charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className=" bg-gradient-to-br from-slate-50 to-slate-100 p-6">
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
        <>
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
                     hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200
                     shadow-md hover:shadow-lg"
                  >
                    Tạo phiếu nhập kho
                  </button>
                  <button
                    onClick={() => nav("/export/create-request")}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium 
                     hover:from-emerald-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200
                     shadow-md hover:shadow-lg"
                  >
                    Tạo phiếu xuất kho
                  </button>
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium 
                     hover:from-amber-600 hover:to-amber-700 transform hover:scale-105 transition-all duration-200
                     shadow-md hover:shadow-lg"
                  >
                    Tạo phiếu kiểm tra tồn kho
                  </button>
                </div>
              </div>
            </div>
          )}
        </>

        {/* Inventory Overview */}
        <div className="space-y-8">

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">


            {/* Summary Cards thay thế cho Bar Chart */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mr-3"></div>
                Tổng quan hàng tồn kho
              </h3>

              <div className="grid grid-cols-2 gap-4">
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
                <SummaryCard
                  title="KHẢ DỤNG"
                  value={inventoryItemOverviewStats.fabric.totalInventoryItemAvailable + inventoryItemOverviewStats.accessories.totalInventoryItemAvailable}
                  icon={<CheckCircleOutlined />}
                  color="from-emerald-500 to-emerald-600"
                  subtitle="Sẵn sàng sử dụng"
                />
                <SummaryCard
                  title="CẦN XỬ LÝ"
                  value={
                    inventoryItemOverviewStats.fabric.totalInventoryItemNeedLiquid +
                    inventoryItemOverviewStats.accessories.totalInventoryItemNeedLiquid +
                    inventoryItemOverviewStats.fabric.totalInventoryItemNoLongerExist +
                    inventoryItemOverviewStats.accessories.totalInventoryItemNoLongerExist
                  }
                  icon={<ExclamationCircleOutlined />}
                  color="from-red-500 to-red-600"
                  subtitle="Thanh lý & Không tồn tại"
                />
              </div>
            </div>

            {/* Pie Charts */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
                Phân bố hàng tồn kho theo trạng thái
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Fabric Pie Chart */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-4 text-center">Hàng Vải</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartData.fabricData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.fabricData.map((entry, index) => (
                          <Cell key={`fabric-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {chartData.fabricData.map((item, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <div
                          className="w-3 h-3 rounded-full mr-1"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accessories Pie Chart */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-4 text-center">Phụ Liệu</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartData.accessoriesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.accessoriesData.map((entry, index) => (
                          <Cell key={`accessories-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {chartData.accessoriesData.map((item, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <div
                          className="w-3 h-3 rounded-full mr-1"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Details Table */}
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
                    <th className="text-center py-3 px-4 font-semibold text-orange-700">Chuẩn bị xuất</th>
                    <th className="text-center py-3 px-4 font-semibold text-red-700">Thanh lý</th>
                    <th className="text-center py-3 px-4 font-semibold text-blue-700">Đang nhập kho</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Không tồn tại</th>
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
                    <td className="text-center py-3 px-4 text-orange-600 font-semibold">
                      {inventoryItemOverviewStats.fabric.totalInventoryItemUnAvailable.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4 text-red-600 font-semibold">
                      {inventoryItemOverviewStats.fabric.totalInventoryItemNeedLiquid.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4 text-blue-600 font-semibold">
                      {inventoryItemOverviewStats.fabric.totalInventoryItemReadToStore.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4 text-gray-600 font-semibold">
                      {inventoryItemOverviewStats.fabric.totalInventoryItemNoLongerExist.toLocaleString()}
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
                    <td className="text-center py-3 px-4 text-orange-600 font-semibold">
                      {inventoryItemOverviewStats.accessories.totalInventoryItemUnAvailable.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4 text-red-600 font-semibold">
                      {inventoryItemOverviewStats.accessories.totalInventoryItemNeedLiquid.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4 text-blue-600 font-semibold">
                      {inventoryItemOverviewStats.accessories.totalInventoryItemReadToStore.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4 text-gray-600 font-semibold">
                      {inventoryItemOverviewStats.accessories.totalInventoryItemNoLongerExist.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4 text-slate-800 font-bold">
                      {Object.values(inventoryItemOverviewStats.accessories).reduce((a, b) => a + b, 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Import & Export Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Import Overview */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-purple-500 pl-4">
              Tổng quan nhập kho
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <ImportOutlined style={{ color: "#fff" }} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Phiếu nhập</p>
                    <p className="text-sm text-slate-500">Tổng số phiếu</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">{mockData.importSlips}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <ShoppingCartOutlined style={{ color: "#fff" }} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Đơn nhập</p>
                    <p className="text-sm text-slate-500">Đang xử lý</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-indigo-600">{mockData.importOrders}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-2xl font-bold text-orange-600">{mockData.importsInProgress}</p>
                  <p className="text-sm text-orange-700 font-medium">Đang xử lý</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-600">{mockData.importsStored}</p>
                  <p className="text-sm text-emerald-700 font-medium">Đã nhập kho</p>
                </div>
              </div>
            </div>
          </div>

          {/* Export Overview */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-cyan-500 pl-4">
              Tổng quan xuất kho
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                    <ExportOutlined style={{ color: "#fff" }} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Phiếu xuất</p>
                    <p className="text-sm text-slate-500">Tổng số phiếu</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-cyan-600">{mockData.exportSlips}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-2xl font-bold text-orange-600">{mockData.exportsInProgress}</p>
                  <p className="text-sm text-orange-700 font-medium">Đang xử lý</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-600">{mockData.exportsCompleted}</p>
                  <p className="text-sm text-emerald-700 font-medium">Đã hoàn thành</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Overview */}
        {/* <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-l-4 border-teal-500 pl-4">
            Tổng quan nhân sự
          </h2>
          <div className="max-w-md">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border border-teal-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                  <TeamOutlined className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-teal-600 font-medium text-sm uppercase tracking-wide">
                    Nhân viên hoạt động
                  </p>
                  <p className="text-sm text-teal-700 mt-1">
                    Đang làm việc hôm nay
                  </p>
                </div>
              </div>
              <span className="text-3xl font-bold text-teal-800">{mockData.activeStaff}</span>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default SummaryOverview;