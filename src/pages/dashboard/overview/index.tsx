import React, { useEffect, useState, useMemo } from "react";
import {
  ShoppingCartOutlined,
  InboxOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useInventoryItemService, { InventoryItemFigureResponse } from "../../../services/useInventoryItemService";

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
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Thao tác nhanh</h2>
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
              Kiểm tra tồn kho
            </button>
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 border-l-4 border-blue-500 pl-4">
            Tổng quan kho vải
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-medium text-sm uppercase tracking-wide">
                    Tổng sản phẩm
                  </p>
                  <p className="text-3xl font-bold text-blue-800 mt-1">
                    {inventoryItemOverviewStats.totalProducts.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <InboxOutlined style={{ color: "#fff" }} className="text-white text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 font-medium text-sm uppercase tracking-wide">
                    Khả dụng
                  </p>
                  <p className="text-3xl font-bold text-emerald-800 mt-1">
                    {inventoryItemOverviewStats.totalInventoryItemAvailable.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircleOutlined style={{ color: "#fff" }} className="text-white text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 font-medium text-sm uppercase tracking-wide">
                    Cần thanh lý
                  </p>
                  <p className="text-3xl font-bold text-red-800 mt-1">
                    {inventoryItemOverviewStats.totalInventoryItemNeedLiquid.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <ExclamationCircleOutlined style={{ color: "#fff" }} className="text-white text-xl" />
                </div>
              </div>
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