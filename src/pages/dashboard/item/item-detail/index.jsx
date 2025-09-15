import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Spin,
  Button,
  Descriptions,
  message,
  Modal,
  Tag,
  Table,
  Input,
  Select,
  Checkbox,
  ConfigProvider,
} from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  EditOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
const { TextArea } = Input;
import useItemService from "@/services/useItemService";
import useCategoryService from "@/services/useCategoryService";
import useProviderService from "@/services/useProviderService";
import useInventoryItemService, {
  ItemStatus,
} from "@/services/useInventoryItemService";
import { AccountRole } from "@/utils/enums";
import { DatePicker, Space, Badge, Slider } from "antd";
import { FilterOutlined, ClearOutlined } from "@ant-design/icons";
import moment from "moment";
import locale from "antd/locale/vi_VN";
import "moment/locale/vi";
import ImportExportModal from "@/components/commons/ImportExportModal";

moment.locale("vi");

const ItemDetail = () => {
  const userRole = useSelector((state) => state.user.role);
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState({});
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [inventoryPagination, setInventoryPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredInventoryItems, setFilteredInventoryItems] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [reasonForChange, setReasonForChange] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [inventoryFigure, setInventoryFigure] = useState(null);
  const [figureLoading, setFigureLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    measurementRange: { min: null, max: null },
    dateRange: { start: null, end: null },
    location: "",
    hasExpired: null,
    sortField: null,
    sortOrder: null,
  });
  const [activeTab, setActiveTab] = useState("available");
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [importExportModalVisible, setImportExportModalVisible] =
    useState(false);
  const [itemImportExportData, setItemImportExportData] = useState(null);

  const { getItemById, getItemImportExportNumber } = useItemService();
  const { getCategoryById } = useCategoryService();
  const { getProviderById } = useProviderService();
  const {
    updateInventoryItem,
    getInventoryItemFigure,
    getAllInventoryItemsByItemId,
  } = useInventoryItemService();

  const fetchItemImportExportData = async (itemId) => {
    if (!itemId) return;

    try {
      const response = await getItemImportExportNumber(itemId);
      if (response && response.content) {
        setItemImportExportData(response.content);
      }
    } catch (error) {
      console.error("Error fetching import-export data:", error);
    }
  };

  const fetchItemDetail = async () => {
    try {
      setLoading(true);
      const response = await getItemById(id);

      if (response && response.content) {
        setItem(response.content);

        // Fetch category if categoryId exists
        if (response.content.categoryId) {
          const categoryResponse = await getCategoryById(
            response.content.categoryId
          );
          if (categoryResponse && categoryResponse.content) {
            setCategory(categoryResponse.content);
          }
        }

        // Fetch providers if providerIds exists
        if (
          response.content.providerIds &&
          response.content.providerIds.length > 0
        ) {
          const providerPromises = response.content.providerIds.map(
            async (providerId) => {
              try {
                const providerResponse = await getProviderById(providerId);
                return { id: providerId, data: providerResponse.content };
              } catch (error) {
                return { id: providerId, data: null };
              }
            }
          );

          const providerResults = await Promise.all(providerPromises);
          const providersMap = {};
          providerResults.forEach(({ id, data }) => {
            providersMap[id] = data;
          });
          setProviders(providersMap);
        }

        // SỬA: Gọi với itemId thay vì inventoryItemIds
        fetchInventoryItems(response.content.id); // Đổi từ inventoryItemIds sang id
      }
    } catch (error) {
      message.error("Không thể tải thông tin sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryFigure = async () => {
    if (!id) return;

    try {
      setFigureLoading(true);
      const response = await getInventoryItemFigure();

      if (response && response.content) {
        // Filter để lấy figure của item hiện tại
        const currentItemFigure = response.content.find(
          (figure) => figure.itemId === id
        );
        setInventoryFigure(currentItemFigure || null);
      }
    } catch (error) {
      console.error("Error fetching inventory figure:", error);
    } finally {
      setFigureLoading(false);
    }
  };

  const fetchInventoryItems = async (itemId) => {
    if (!itemId) {
      return;
    }

    try {
      setInventoryLoading(true);

      // Sử dụng getAllInventoryItemsByItemId thay vì nhiều getInventoryItemById
      const allInventoryItems = await getAllInventoryItemsByItemId(itemId);

      setInventoryItems(allInventoryItems);
      setFilteredInventoryItems(allInventoryItems);
      setInventoryPagination((prev) => ({
        ...prev,
        total: allInventoryItems.length,
      }));
    } catch (error) {
      message.error("Không thể tải danh sách hàng tồn kho");
      console.error("Error fetching inventory items:", error);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Function để apply filters
  const applyFilters = (items, currentFilters, searchTerm) => {
    let filtered = [...items];

    // Text search
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        item.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (currentFilters.status && currentFilters.status.length > 0) {
      filtered = filtered.filter((item) =>
        currentFilters.status.includes(item.status)
      );
    }

    // Measurement value range filter
    if (
      currentFilters.measurementRange.min !== null ||
      currentFilters.measurementRange.max !== null
    ) {
      filtered = filtered.filter((item) => {
        const value = item.measurementValue || 0;
        const min = currentFilters.measurementRange.min;
        const max = currentFilters.measurementRange.max;

        if (min !== null && max !== null) {
          return value >= min && value <= max;
        } else if (min !== null) {
          return value >= min;
        } else if (max !== null) {
          return value <= max;
        }
        return true;
      });
    }

    // Date range filter (imported date)
    if (currentFilters.dateRange.start || currentFilters.dateRange.end) {
      filtered = filtered.filter((item) => {
        if (!item.importedDate) return false;

        const itemDate = new Date(item.importedDate);
        const startDate = currentFilters.dateRange.start;
        const endDate = currentFilters.dateRange.end;

        if (startDate && endDate) {
          return itemDate >= startDate && itemDate <= endDate;
        } else if (startDate) {
          return itemDate >= startDate;
        } else if (endDate) {
          return itemDate <= endDate;
        }
        return true;
      });
    }

    // Location filter
    if (currentFilters.location && currentFilters.location.trim()) {
      filtered = filtered.filter((item) =>
        item.storedLocationName
          ?.toLowerCase()
          .includes(currentFilters.location.toLowerCase())
      );
    }

    // Expired filter
    if (currentFilters.hasExpired !== null) {
      const now = new Date();
      filtered = filtered.filter((item) => {
        if (!item.expiredDate) return !currentFilters.hasExpired;

        const expiredDate = new Date(item.expiredDate);
        const isExpired = expiredDate < now;

        return currentFilters.hasExpired ? isExpired : !isExpired;
      });
    }

    return filtered;
  };

  // Function để count active filters
  const countActiveFilters = (currentFilters) => {
    let count = 0;

    if (currentFilters.status && currentFilters.status.length > 0) count++;
    if (
      currentFilters.measurementRange.min !== null ||
      currentFilters.measurementRange.max !== null
    )
      count++;
    if (currentFilters.dateRange.start || currentFilters.dateRange.end) count++;
    if (currentFilters.location && currentFilters.location.trim()) count++;
    if (currentFilters.hasExpired !== null) count++;

    return count;
  };

  // Tab definitions
  const inventoryTabs = [
    {
      key: "available",
      label: "Có thể xuất",
      statuses: [ItemStatus.AVAILABLE],
      color: "success",
      badge: "green",
    },
    {
      key: "unavailable",
      label: "Trong quá trình xuất",
      statuses: [ItemStatus.UNAVAILABLE],
      color: "warning",
      badge: "orange",
    },
    {
      key: "ready",
      label: "Chuẩn bị vào kho",
      statuses: [ItemStatus.READY_TO_STORE],
      color: "processing",
      badge: "blue",
    },
    {
      key: "liquidated",
      label: "Hàng thanh lý / Đã xuất",
      statuses: [ItemStatus.NEED_LIQUID, ItemStatus.NO_LONGER_EXIST],
      color: "default",
      badge: "gray",
    },
  ];

  // Function để filter theo tab và search
  const getFilteredItemsByTab = (tabKey, items) => {
    const tab = inventoryTabs.find((t) => t.key === tabKey);
    if (!tab) return [];

    return items.filter((item) => tab.statuses.includes(item.status));
  };

  // Function để search toàn cục
  const handleGlobalSearch = (searchValue) => {
    setGlobalSearchTerm(searchValue);

    if (!searchValue.trim()) {
      setSearchResults(null);
      return;
    }

    // Search trong tất cả inventory items
    const results = inventoryItems.filter((item) =>
      item.id?.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Nhóm kết quả theo tab
    const groupedResults = {};
    inventoryTabs.forEach((tab) => {
      groupedResults[tab.key] = results.filter((item) =>
        tab.statuses.includes(item.status)
      );
    });

    setSearchResults({
      total: results.length,
      byTab: groupedResults,
      items: results,
    });
  };

  // Function để get current displayed items
  const getCurrentDisplayedItems = () => {
    if (searchResults && globalSearchTerm.trim()) {
      return searchResults.byTab[activeTab] || [];
    }

    const tabItems = getFilteredItemsByTab(activeTab, inventoryItems);
    return applyFilters(tabItems, filters, ""); // Không dùng searchTerm cũ nữa
  };

  // Function để count items cho badge
  const getTabItemCount = (tabKey) => {
    if (searchResults && globalSearchTerm.trim()) {
      return searchResults.byTab[tabKey]?.length || 0;
    }
    return getFilteredItemsByTab(tabKey, inventoryItems).length;
  };

  useEffect(() => {
    if (id) {
      fetchItemDetail();
      if (canViewInventoryInfo()) {
        fetchItemImportExportData(id);
      }
    }
  }, [id]);

  useEffect(() => {
    const currentItems = getCurrentDisplayedItems();
    let filtered = applyFilters(currentItems, filters, "");

    // Apply sorting nếu có
    if (filters.sortField && filters.sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[filters.sortField] || 0;
        const bValue = b[filters.sortField] || 0;

        if (filters.sortField === "measurementValue") {
          return filters.sortOrder === "ascend"
            ? aValue - bValue
            : bValue - aValue;
        }

        return 0;
      });
    }

    setFilteredInventoryItems(filtered);
    setInventoryPagination((prev) => ({
      ...prev,
      current: 1,
      total: filtered.length,
    }));

    setActiveFiltersCount(countActiveFilters(filters));
  }, [inventoryItems, globalSearchTerm, searchResults, filters, activeTab]);

  useEffect(() => {
    if (id && canViewInventoryInfo()) {
      fetchInventoryFigure();
    }
  }, [id, userRole]);

  // Function để clear filters
  const clearAllFilters = () => {
    setFilters({
      status: [],
      measurementRange: { min: null, max: null },
      dateRange: { start: null, end: null },
      location: "",
      hasExpired: null,
      sortField: null,
      sortOrder: null,
    });
    // Không clear globalSearchTerm ở đây
    setInventoryPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  // Function để handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleOpenImportExportModal = () => {
    setImportExportModalVisible(true);
  };

  const handleCloseImportExportModal = () => {
    setImportExportModalVisible(false);
  };

  // Get min and max measurement values for slider
  const getMeasurementRange = () => {
    if (inventoryItems.length === 0) return [0, 100];

    const values = inventoryItems
      .map((item) => item.measurementValue || 0)
      .filter((val) => val >= 0); // Lấy tất cả values >= 0

    if (values.length === 0) return [0, 100];

    const max = Math.max(...values);

    // Luôn bắt đầu từ 0, đến max (hoặc 100 nếu max = 0)
    return [0, max === 0 ? 100 : max];
  };

  // Status options for filter
  const statusOptions = [
    { label: "Có sẵn", value: ItemStatus.AVAILABLE, color: "success" },
    { label: "Không có sẵn", value: ItemStatus.UNAVAILABLE, color: "error" },
    { label: "Cần thanh lý", value: ItemStatus.NEED_LIQUID, color: "error" },
    {
      label: "Không tồn tại",
      value: ItemStatus.NO_LONGER_EXIST,
      color: "default",
    },
    {
      label: "Chuẩn bị vô kho",
      value: ItemStatus.READY_TO_STORE,
      color: "default",
    },
  ];

  const formatLocation = (location) => {
    if (!location) return "Không có vị trí";

    return location
      .replace(/Zone:/g, "Khu:")
      .replace(/Floor:/g, "Tầng:")
      .replace(/Row:/g, "Hàng:")
      .replace(/Line:/g, "Cột:");
  };

  const canViewInventoryInfo = () => {
    return (
      userRole === AccountRole.MANAGER || userRole === AccountRole.DEPARTMENT
    );
  };

  const calculateAvailableQuantity = () => {
    if (!itemImportExportData) return 0;
    const inventoryBalance =
      itemImportExportData.importMeasurementValue -
      itemImportExportData.exportMeasurementValue;
    return Math.max(
      0,
      inventoryBalance -
        (item?.minimumStockQuantity || 0) * (item?.measurementValue || 0)
    );
  };

  const calculateCurrentInventory = () => {
    if (!itemImportExportData) return 0;
    return (
      itemImportExportData.importMeasurementValue -
      itemImportExportData.exportMeasurementValue
    );
  };

  const calculateAvailableValue = () => {
    if (!itemImportExportData) return 0;
    const inventoryBalance =
      itemImportExportData.importMeasurementValue -
      itemImportExportData.exportMeasurementValue;
    return Math.max(
      0,
      inventoryBalance -
        (item?.minimumStockQuantity || 0) * (item?.measurementValue || 0)
    );
  };

  const renderProviders = () => {
    if (!item.providerIds || item.providerIds.length === 0) {
      return "Chưa có nhà cung cấp";
    }

    const formatProviderName = (name) => {
      if (!name) return name;

      const lowerName = name.toLowerCase();
      if (lowerName.includes("công ty")) {
        const parts = name.split(/công ty/i);
        if (parts.length > 1) {
          return (
            <span>
              Công ty <strong>{parts[1].trim()}</strong>
            </span>
          );
        }
      }
      return name;
    };

    return (
      <div>
        {item.providerIds.map((providerId) => {
          const provider = providers[providerId];
          const displayName = provider
            ? formatProviderName(provider.name)
            : `Provider ${providerId}`;
          return <div key={providerId}>• {displayName}</div>;
        })}
      </div>
    );
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleViewInventoryDetail = (inventoryItem) => {
    setSelectedInventoryItem(inventoryItem);
    setModalVisible(true);
  };

  const handleInventoryTableChange = (pagination, _, sorter) => {
    setInventoryPagination(pagination);

    // Update sorting nếu có
    if (sorter) {
      setFilters((prev) => ({
        ...prev,
        sortField: sorter.field || null,
        sortOrder: sorter.order || null,
      }));
    }
  };

  const isFormComplete = () => {
    return newStatus && reasonForChange.trim();
  };

  const handleEditStatus = (inventoryItem) => {
    setEditingInventoryItem(inventoryItem);
    setNewStatus(null);
    setReasonForChange("");
    setEditModalVisible(true);
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || !reasonForChange.trim()) {
      message.error("Vui lòng chọn trạng thái mới và nhập lý do");
      return;
    }

    if (!confirmationChecked) {
      message.error("Vui lòng xác nhận trước khi cập nhật");
      return;
    }

    try {
      setUpdateLoading(true);
      await updateInventoryItem({
        id: editingInventoryItem.id,
        status: newStatus,
        reasonForDisposal: reasonForChange.trim(),
      });

      // SỬA: Refresh với itemId thay vì inventoryItemIds
      await fetchInventoryItems(item.id); // Đổi từ item?.inventoryItemIds sang item.id

      setEditModalVisible(false);
      message.success("Cập nhật trạng thái thành công");
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingInventoryItem(null);
    setNewStatus(null);
    setReasonForChange("");
    setConfirmationChecked(false); // Reset checkbox
  };

  const getStatusTag = (status) => {
    switch (status) {
      case ItemStatus.AVAILABLE:
        return <Tag color="success">Có sẵn</Tag>;
      case ItemStatus.UNAVAILABLE:
        return <Tag color="error">Không có sẵn</Tag>;
      case ItemStatus.DISPOSED:
        return <Tag color="default">Đã hủy</Tag>;
      case ItemStatus.SAFE:
        return <Tag color="blue">An toàn</Tag>;
      case ItemStatus.ALMOST_OUT_OF_DATE:
        return <Tag color="warning">Sắp hết hạn</Tag>;
      case ItemStatus.NEED_LIQUID:
        return <Tag color="warning">Thanh lý</Tag>;
      case ItemStatus.NO_LONGER_EXIST:
        return <Tag color="default">Không tồn tại</Tag>;
      case ItemStatus.READY_TO_STORE:
        return <Tag color="default">Chuẩn bị vô kho</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  // Thêm helper function để get status options
  const getAvailableStatusOptions = (currentStatus) => {
    const statusMap = {
      [ItemStatus.AVAILABLE]: [
        ItemStatus.UNAVAILABLE,
        ItemStatus.NO_LONGER_EXIST,
      ],
      [ItemStatus.UNAVAILABLE]: [
        ItemStatus.AVAILABLE,
        ItemStatus.NO_LONGER_EXIST,
      ],
      [ItemStatus.READY_TO_STORE]: [
        ItemStatus.UNAVAILABLE,
        ItemStatus.AVAILABLE,
        ItemStatus.NO_LONGER_EXIST,
      ],
      [ItemStatus.NO_LONGER_EXIST]: [
        ItemStatus.AVAILABLE,
        ItemStatus.UNAVAILABLE,
        ItemStatus.NEED_LIQUID,
        ItemStatus.READY_TO_STORE,
      ],
      [ItemStatus.NEED_LIQUID]: [
        ItemStatus.AVAILABLE,
        ItemStatus.UNAVAILABLE,
        ItemStatus.NO_LONGER_EXIST,
      ],
    };

    return statusMap[currentStatus] || [];
  };

  // Thêm helper function để get status label và color
  const getStatusInfo = (status) => {
    switch (status) {
      case ItemStatus.AVAILABLE:
        return { label: "Có sẵn", color: "success" };
      case ItemStatus.UNAVAILABLE:
        return { label: "Không có sẵn", color: "error" };
      case ItemStatus.NEED_LIQUID:
        return { label: "Cần Thanh lý", color: "error" };
      case ItemStatus.NO_LONGER_EXIST:
        return { label: "Không tồn tại trong kho", color: "default" };
      case ItemStatus.READY_TO_STORE:
        return { label: "Chuẩn bị vô kho", color: "default" };
      default:
        return { label: status, color: "default" };
    }
  };

  const inventoryColumns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "id",
      key: "id",
      width: "35%",
    },
    {
      title: "Giá trị đo lường",
      key: "measurementValue",
      dataIndex: "measurementValue",
      align: "center",
      width: "15%",
      sorter: true,
      sortOrder:
        filters.sortField === "measurementValue" ? filters.sortOrder : null,
      render: (value, record) => (
        <span>
          <strong style={{ fontSize: "16px" }}>{value || 0}</strong>{" "}
          {item?.measurementUnit}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: "21%",
      render: (status, record) => (
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-center">
            {getStatusTag(status)}
          </div>
          {canViewInventoryInfo() && status !== ItemStatus.NO_LONGER_EXIST && (
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditStatus(record)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 -ml-6"
            />
          )}
        </div>
      ),
    },
    {
      title: "Ngày nhập",
      dataIndex: "importedDate",
      key: "importedDate",
      align: "center",
      width: "17%",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Chi tiết",
      key: "detail",
      align: "center",
      render: (text, record) => (
        <span
          className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer"
          style={{ width: 32, height: 32 }}
          onClick={() => handleViewInventoryDetail(record)}
        >
          <EyeOutlined style={{ fontSize: 16, fontWeight: 700 }} />
        </span>
      ),
    },
  ];

  // 8. JSX cho tabs và search mới
  const renderInventoryTabs = () => (
    <div className="mb-4">
      {/* Global Search */}
      <div className="mb-4 space-y-4">
        <div className="flex items-center gap-4">
          <span className="font-medium">Tìm kiếm toàn bộ:</span>
          <Input
            placeholder="Tìm kiếm mã sản phẩm trong tất cả trạng thái..."
            value={globalSearchTerm}
            onChange={(e) => handleGlobalSearch(e.target.value)}
            style={{ width: 500 }}
            allowClear
            onClear={() => handleGlobalSearch("")}
          />

          {searchResults && (
            <div className="flex items-center gap-2">
              <Badge
                count={searchResults.total}
                overflowCount={999999}
                style={{ backgroundColor: "#52c41a" }}
              />
              <span className="text-sm text-gray-600">kết quả</span>
            </div>
          )}
        </div>

        {/* Search Results Summary */}
        {searchResults && globalSearchTerm.trim() && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-800 mb-2">
              <strong>Kết quả tìm kiếm "{globalSearchTerm}":</strong>
            </div>
            <div className="flex flex-wrap gap-3">
              {inventoryTabs.map((tab) => {
                const count = searchResults.byTab[tab.key]?.length || 0;
                return (
                  <div
                    key={tab.key}
                    className={`cursor-pointer px-3 py-1 rounded-full text-sm border-2 transition-all ${
                      activeTab === tab.key
                        ? "border-blue-500 bg-blue-100 text-blue-700"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}: <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {inventoryTabs.map((tab) => {
          const count = getTabItemCount(tab.key);
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <Badge
                count={count}
                overflowCount={999999}
                style={{
                  backgroundColor: isActive ? "#1890ff" : "#d9d9d9",
                  color: isActive ? "white" : "#666",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto p-5">
        <div className="text-center">
          <h2>Không tìm thấy sản phẩm</h2>
          <Button onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-5">
      <div className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          Quay lại
        </Button>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            Chi tiết mặt hàng: {`${item.name} (${item.id})`}
          </h1>

          {canViewInventoryInfo() && (
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={handleOpenImportExportModal}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              size="large"
            >
              Xem báo cáo xuất nhập kho
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-lg">
        <Descriptions
          bordered
          column={2}
          labelStyle={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
        >
          <Descriptions.Item label="Tên mặt hàng" span={1}>
            {item.name}
          </Descriptions.Item>

          <Descriptions.Item label="Mô tả" span={2}>
            {item.description || "Không có mô tả"}
          </Descriptions.Item>

          <Descriptions.Item label="Giá trị đo lường chuẩn">
            <strong style={{ fontSize: "16px" }}>
              {item.measurementValue || 0}
            </strong>{" "}
            {item?.measurementUnit} {"/"} {item?.unitType}
          </Descriptions.Item>

          <Descriptions.Item label="Danh mục hàng">
            {category ? category.name : "Không xác định"}
          </Descriptions.Item>

          {/* Chỉ hiện cho MANAGER và DEPARTMENT */}
          {canViewInventoryInfo() && (
            <>
              {/* <Descriptions.Item label="Số lượng tồn kho">
                <strong style={{ fontSize: "18px" }}>
                  {item.quantity || 0}
                </strong>{" "}
                {item.unitType}
              </Descriptions.Item>

              <Descriptions.Item label="Số lượng khả dụng">
                <strong style={{ fontSize: "18px" }}>
                  {calculateAvailableQuantity()}
                </strong>{" "}
                {item.unitType}
              </Descriptions.Item> */}

              <Descriptions.Item label="Giá trị tồn kho">
                <strong style={{ fontSize: "18px" }}>
                  {calculateCurrentInventory()}
                </strong>{" "}
                {item.measurementUnit}
              </Descriptions.Item>

              <Descriptions.Item label="Giá trị khả dụng">
                <strong style={{ fontSize: "18px" }}>
                  {calculateAvailableValue()}
                </strong>{" "}
                {item.measurementUnit}
              </Descriptions.Item>
            </>
          )}

          <Descriptions.Item label="Tồn kho tối thiểu">
            <strong style={{ fontSize: "16px" }}>
              {item.minimumStockQuantity || 0}
            </strong>{" "}
            {item.unitType}
          </Descriptions.Item>

          <Descriptions.Item label="Tồn kho tối đa">
            <strong style={{ fontSize: "16px" }}>
              {item.maximumStockQuantity || 0}
            </strong>{" "}
            {item.unitType}
          </Descriptions.Item>

          <Descriptions.Item label="Nhà cung cấp" span={2}>
            {renderProviders()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {canViewInventoryInfo() && (
        <div className="mt-5">
          <Card
            // title={`Tổng quan hàng thuộc ${item.name} (${item.id})`}
            className="shadow-lg"
            loading={figureLoading}
          >
            {inventoryFigure ? (
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {inventoryFigure.totalInventoryItemAvailable}
                  </div>
                  <div className="text-sm text-green-700 font-medium">
                    Có sẵn
                  </div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {inventoryFigure.totalInventoryItemUnAvailable}
                  </div>
                  <div className="text-sm text-red-700 font-medium">
                    Không có sẵn
                  </div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {inventoryFigure.totalInventoryItemReadToStore}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">
                    Chuẩn bị vào kho
                  </div>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {inventoryFigure.totalInventoryItemNeedLiquid}
                  </div>
                  <div className="text-sm text-orange-700 font-medium">
                    Cần thanh lý
                  </div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-gray-600 mb-1">
                    {inventoryFigure.totalInventoryItemNoLongerExist}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    Không tồn tại (Đã xuất)
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Không có dữ liệu tổng quan
              </div>
            )}
          </Card>
        </div>
      )}

      {canViewInventoryInfo() && (
        <div className="mt-5">
          <Card
            title={`Danh sách hàng thuộc ${item.name} (${item.id})`}
            className="shadow-lg mt-6"
          >
            {/* Render tabs */}
            {renderInventoryTabs()}
            <div className="mb-4 space-y-4">
              {/* Search và Filter buttons */}
              <div className="flex items-center gap-4">
                <Space>
                  <Badge count={activeFiltersCount} offset={[-5, 5]}>
                    <Button
                      icon={<FilterOutlined />}
                      onClick={() => setFilterVisible(!filterVisible)}
                      type={filterVisible ? "primary" : "default"}
                    >
                      Bộ lọc
                    </Button>
                  </Badge>

                  {activeFiltersCount > 0 && (
                    <Button
                      icon={<ClearOutlined />}
                      onClick={clearAllFilters}
                      type="text"
                      danger
                    >
                      Xóa bộ lọc
                    </Button>
                  )}
                </Space>
              </div>

              {/* Filter Panel */}
              {filterVisible && (
                <Card className="bg-gray-50" size="small">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-4">
                      Bộ lọc nâng cao
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Trạng thái
                        </label>
                        <Select
                          mode="multiple"
                          placeholder="Chọn trạng thái"
                          value={filters.status}
                          onChange={(value) =>
                            handleFilterChange("status", value)
                          }
                          style={{ width: "100%" }}
                          maxTagCount={2}
                        >
                          {statusOptions.map((option) => (
                            <Select.Option
                              key={option.value}
                              value={option.value}
                            >
                              <Tag color={option.color} size="small">
                                {option.label}
                              </Tag>
                            </Select.Option>
                          ))}
                        </Select>
                      </div>

                      {/* Measurement Range Filter */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Giá trị đo lường ({item?.measurementUnit})
                        </label>
                        <div className="space-y-2">
                          <Slider
                            range
                            min={getMeasurementRange()[0]}
                            max={getMeasurementRange()[1]}
                            value={[
                              filters.measurementRange.min ??
                                getMeasurementRange()[0],
                              filters.measurementRange.max ??
                                getMeasurementRange()[1],
                            ]}
                            onChange={(value) =>
                              handleFilterChange("measurementRange", {
                                min: value[0],
                                max: value[1],
                              })
                            }
                            tooltip={{
                              formatter: (value) =>
                                `${value} ${item?.measurementUnit}`,
                            }}
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>
                              {getMeasurementRange()[0]} {item?.measurementUnit}
                            </span>
                            <span>
                              {getMeasurementRange()[1]} {item?.measurementUnit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Date Range Filter với ConfigProvider */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Ngày nhập kho
                        </label>
                        <ConfigProvider locale={locale}>
                          <DatePicker.RangePicker
                            value={
                              filters.dateRange.start && filters.dateRange.end
                                ? [
                                    moment(filters.dateRange.start),
                                    moment(filters.dateRange.end),
                                  ]
                                : null
                            }
                            onChange={(dates) =>
                              handleFilterChange("dateRange", {
                                start: dates?.[0]?.toDate() || null,
                                end: dates?.[1]?.toDate() || null,
                              })
                            }
                            format="DD/MM/YYYY"
                            style={{ width: "100%" }}
                            placeholder={["Từ ngày", "Đến ngày"]}
                          />
                        </ConfigProvider>
                      </div>

                      {/* Location Filter */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Vị trí lưu trữ
                        </label>
                        <Input
                          placeholder="Tìm theo vị trí..."
                          value={filters.location}
                          onChange={(e) =>
                            handleFilterChange("location", e.target.value)
                          }
                          allowClear
                        />
                      </div>

                      {/* Expiry Status Filter */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Tình trạng hết hạn
                        </label>
                        <Select
                          placeholder="Chọn tình trạng"
                          value={filters.hasExpired}
                          onChange={(value) =>
                            handleFilterChange("hasExpired", value)
                          }
                          style={{ width: "100%" }}
                          allowClear
                        >
                          <Select.Option value={true}>
                            <Tag color="error">Đã hết hạn</Tag>
                          </Select.Option>
                          <Select.Option value={false}>
                            <Tag color="success">Còn hạn</Tag>
                          </Select.Option>
                        </Select>
                      </div>

                      {/* Quick Stats */}
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium mb-2">
                          Kết quả lọc
                        </label>
                        <div className="bg-white p-3 rounded border">
                          <span className="text-lg font-semibold text-blue-600">
                            {filteredInventoryItems.length}
                          </span>
                          <span className="text-sm text-gray-500">
                            / {inventoryItems.length} sản phẩm
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <Table
              columns={inventoryColumns}
              dataSource={filteredInventoryItems}
              rowKey="id"
              loading={inventoryLoading}
              pagination={{
                ...inventoryPagination,
                showSizeChanger: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} sản phẩm`,
              }}
              onChange={handleInventoryTableChange}
            />
          </Card>
        </div>
      )}

      {/* Modal hiển thị chi tiết inventory item */}
      <Modal
        title={`Chi tiết sản phẩm`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {selectedInventoryItem && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Mã sản phẩm">
              {selectedInventoryItem.id}
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị đo lường">
              <strong style={{ fontSize: "16px" }}>
                {selectedInventoryItem.measurementValue || 0}
              </strong>{" "}
              {item?.measurementUnit}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getStatusTag(selectedInventoryItem.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày nhập">
              {selectedInventoryItem.importedDate
                ? new Date(
                    selectedInventoryItem.importedDate
                  ).toLocaleDateString("vi-VN")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày hết hạn">
              {selectedInventoryItem.expiredDate
                ? new Date(
                    selectedInventoryItem.expiredDate
                  ).toLocaleDateString("vi-VN")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Vị trí lưu trữ">
              {formatLocation(selectedInventoryItem.storedLocationName)}
            </Descriptions.Item>
            <Descriptions.Item label="Sản phẩm kế thừa từ">
              {selectedInventoryItem.parentId || "Không có"}
            </Descriptions.Item>
            <Descriptions.Item label="Sản phẩm con">
              {selectedInventoryItem.childrenIds &&
              selectedInventoryItem.childrenIds.length > 0
                ? selectedInventoryItem.childrenIds.join(", ")
                : "Không có"}
            </Descriptions.Item>
            {selectedInventoryItem.reasonForDisposal && (
              <Descriptions.Item label="Lý do thanh lý">
                {selectedInventoryItem.reasonForDisposal}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
      <Modal
        title="Chỉnh sửa trạng thái sản phẩm"
        open={editModalVisible}
        onOk={handleUpdateStatus}
        onCancel={handleCancelEdit}
        confirmLoading={updateLoading}
        width={600}
        okText="Cập nhật"
        cancelText="Hủy"
        okButtonProps={{
          disabled: !confirmationChecked,
        }}
      >
        {editingInventoryItem && (
          <div className="space-y-4">
            {/* Thông tin sản phẩm */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Thông tin sản phẩm</h4>
              <div className="grid grid-cols-10 gap-4 text-sm mt-2">
                <div className="col-span-7">
                  <span className="text-gray-600">Mã sản phẩm:</span>
                  <div
                    className="font-medium mt-1"
                    style={{ fontSize: "16px" }}
                  >
                    {editingInventoryItem.id}
                  </div>
                </div>
                <div className="col-span-3">
                  <span className="text-gray-600">Trạng thái hiện tại:</span>
                  <div className="mt-1">
                    {getStatusTag(editingInventoryItem.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Chọn trạng thái mới */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Trạng thái mới <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Chọn trạng thái mới"
                value={newStatus}
                onChange={setNewStatus}
                className="w-full"
                size="large"
              >
                {getAvailableStatusOptions(editingInventoryItem.status).map(
                  (status) => {
                    const statusInfo = getStatusInfo(status);
                    return (
                      <Select.Option key={status} value={status}>
                        <Tag color={statusInfo.color} className="mr-2">
                          {statusInfo.label}
                        </Tag>
                      </Select.Option>
                    );
                  }
                )}
              </Select>
            </div>

            {/* Preview trạng thái mới */}
            {newStatus && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Xác nhận thay đổi:</strong>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusTag(editingInventoryItem.status)}
                  <span className="text-gray-400">→</span>
                  <Tag color={getStatusInfo(newStatus).color}>
                    {getStatusInfo(newStatus).label}
                  </Tag>
                </div>
              </div>
            )}

            {/* Lý do đổi trạng thái */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Lý do đổi trạng thái <span className="text-red-500">*</span>
              </label>
              <TextArea
                className="mb-4"
                placeholder="Nhập lý do đổi trạng thái..."
                value={reasonForChange}
                onChange={(e) => setReasonForChange(e.target.value)}
                rows={3}
                maxLength={200}
                showCount
              />
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Checkbox
                checked={confirmationChecked}
                onChange={(e) => setConfirmationChecked(e.target.checked)}
                disabled={!isFormComplete()}
                className="text-sm"
              >
                <span className="text-gray-700">
                  Tôi xác nhận đổi trạng thái của mã hàng tồn kho này, và sẽ
                  chịu trách nhiệm nếu có sai sót về dữ liệu trong kho sau khi
                  thay đổi.
                </span>
              </Checkbox>
            </div>
          </div>
        )}
      </Modal>
      {/* Import Export Modal */}
      <ImportExportModal
        visible={importExportModalVisible}
        onClose={handleCloseImportExportModal}
        itemId={id}
        item={item}
      />
    </div>
  );
};

export default ItemDetail;
