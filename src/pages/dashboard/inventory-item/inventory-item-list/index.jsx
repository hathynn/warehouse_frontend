import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Input,
  Tag,
  Card,
  Button,
  Modal,
  Descriptions,
  Select,
  Badge,
  Slider,
  DatePicker,
  ConfigProvider,
  Space,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  FilterOutlined,
  ClearOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import useInventoryItemService, {
  ItemStatus,
} from "@/services/useInventoryItemService";
import useItemService from "@/services/useItemService";
import moment from "moment";
import locale from "antd/locale/vi_VN";
import "moment/locale/vi";
import PropTypes from "prop-types";
import debounce from "lodash/debounce";
import QRCode from "react-qr-code";

moment.locale("vi");

const InventoryItemList = () => {
  // ===== 1. KHAI BÁO STATE =====
  const [inventoryItems, setInventoryItems] = useState([]);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // Thêm state cho input value
  const [filteredItems, setFilteredItems] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [filters, setFilters] = useState({
    status: [],
    measurementRange: { min: null, max: null },
    dateRange: { start: null, end: null },
    location: "",
    hasExpired: null,
    itemName: "",
    sortField: null,
    sortOrder: null,
  });
  const [allInventoryItems, setAllInventoryItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [dataCache, setDataCache] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrItem, setQrItem] = useState(null);

  // ===== 2. HOOKS =====
  const {
    getAllInventoryItemsWithoutPagination,
    getInventoryItemHistory,
    loading: inventoryLoading,
  } = useInventoryItemService();
  const { getItems, loading: itemsLoading } = useItemService();

  // ===== 3. FUNCTIONS =====
  const fetchData = async (forceRefresh = false) => {
    // Nếu đã có cache và không force refresh thì return
    if (dataCache && !forceRefresh) {
      setAllInventoryItems(dataCache.inventoryItems);
      setInventoryItems(dataCache.inventoryItems);
      setItems(dataCache.items);
      setIsInitialLoading(false);
      return;
    }

    try {
      setIsInitialLoading(true);
      const [inventoryItems, itemsResponse] = await Promise.all([
        getAllInventoryItemsWithoutPagination(),
        getItems(),
      ]);

      if (inventoryItems && itemsResponse?.content) {
        // Lưu vào cache
        const cache = {
          inventoryItems,
          items: itemsResponse.content,
          timestamp: Date.now(),
        };
        setDataCache(cache);
        localStorage.setItem("inventoryCache", JSON.stringify(cache));

        setAllInventoryItems(inventoryItems);
        setInventoryItems(inventoryItems);
        setItems(itemsResponse.content);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchInventoryHistory = async (inventoryItemId) => {
    try {
      setLoadingHistory(true);
      const response = await getInventoryItemHistory(inventoryItemId);
      if (response?.content) {
        setHistoryData(response.content);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const applyFilters = (items, currentFilters, searchTerm) => {
    let filtered = [...items];

    // Text search (ID)
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        item.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Item name filter
    if (currentFilters.itemName && currentFilters.itemName.trim()) {
      filtered = filtered.filter((item) =>
        item.itemName
          ?.toLowerCase()
          .includes(currentFilters.itemName.toLowerCase())
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
    if (currentFilters.itemName && currentFilters.itemName.trim()) count++;

    return count;
  };

  // ===== 4. MEMOIZED VALUES =====
  const processedData = useMemo(() => {
    let filtered = applyFilters(allInventoryItems, filters, searchTerm);

    // Apply sorting
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

    return filtered;
  }, [allInventoryItems, filters, searchTerm]);

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setSearchTerm(value);
      }, 300),
    []
  );

  // ===== 5. EFFECTS =====

  // Effect 1: Load data từ cache hoặc fetch mới khi mount
  useEffect(() => {
    const cachedData = localStorage.getItem("inventoryCache");
    if (cachedData) {
      try {
        const cache = JSON.parse(cachedData);
        // Cache còn fresh (dưới 1 giờ)
        if (Date.now() - cache.timestamp < 60 * 60 * 1000) {
          setDataCache(cache);
          setAllInventoryItems(cache.inventoryItems);
          setInventoryItems(cache.inventoryItems);
          setItems(cache.items);
          setIsInitialLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error parsing cache:", error);
      }
    }
    // Nếu không có cache hoặc cache cũ, fetch mới
    fetchData();
  }, []);

  // Effect 2: Update displayed items khi processedData hoặc pagination thay đổi
  useEffect(() => {
    const maxPage = Math.ceil(processedData.length / pagination.pageSize);
    const currentPage = pagination.current > maxPage ? 1 : pagination.current;

    const startIndex = (currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;

    setFilteredItems(processedData);
    setDisplayedItems(processedData.slice(startIndex, endIndex));
    setActiveFiltersCount(countActiveFilters(filters));

    if (currentPage !== pagination.current) {
      setPagination((prev) => ({ ...prev, current: currentPage }));
    }
  }, [processedData, pagination.current, pagination.pageSize, filters]);

  // Effect 3: Cleanup debounce khi unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // ===== 6. HANDLERS =====
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value); // Update input value immediately
    debouncedSearch(value); // Debounce actual search
  };

  const clearAllFilters = () => {
    setFilters({
      status: [],
      measurementRange: { min: null, max: null },
      dateRange: { start: null, end: null },
      location: "",
      hasExpired: null,
      itemName: "",
      sortField: null,
      sortOrder: null,
    });
    setSearchTerm("");
    setSearchInput(""); // Clear input display
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const getMeasurementRange = () => {
    if (allInventoryItems.length === 0) return [0, 100];

    const values = allInventoryItems
      .map((item) => item.measurementValue || 0)
      .filter((val) => val >= 0);

    if (values.length === 0) return [0, 100];

    const max = Math.max(...values);
    return [0, max === 0 ? 100 : max];
  };

  const handleTableChange = (newPagination, _, sorter) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: filteredItems.length,
    });

    if (sorter) {
      setFilters((prev) => ({
        ...prev,
        sortField: sorter.field || null,
        sortOrder: sorter.order || null,
      }));

      if (sorter.field) {
        setPagination((prev) => ({
          ...prev,
          current: 1,
        }));
      }
    }
  };

  const handleViewInventoryDetail = async (inventoryItem) => {
    setSelectedInventoryItem(inventoryItem);
    setModalVisible(true);
    await fetchInventoryHistory(inventoryItem.id);
  };

  const openQrModal = (record) => {
    setQrItem(record);
    setQrModalVisible(true);
  };

  const closeQrModal = () => {
    setQrModalVisible(false);
    setQrItem(null);
  };

  // ===== 7. HELPER FUNCTIONS =====
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
        return <Tag color="error">Thanh lý</Tag>;
      case ItemStatus.NO_LONGER_EXIST:
        return <Tag color="default">Không tồn tại</Tag>;
      case ItemStatus.READY_TO_STORE:
        return <Tag color="default">Chuẩn bị vô kho</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const formatLocation = (location) => {
    if (!location) return "Không có vị trí";

    return location
      .replace(/Zone:/g, "Khu:")
      .replace(/Floor:/g, "Tầng:")
      .replace(/Row:/g, "Hàng:")
      .replace(/Line:/g, "Cột:");
  };

  const getInventoryItemInfoFromItem = (inventoryItem) => {
    return items.find((item) => item.id === inventoryItem.itemId);
  };

  // ===== 8. CONFIG DATA =====
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

  const columns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "id",
      key: "id",
      width: "28%",
    },
    {
      title: "Tên mặt hàng",
      dataIndex: "itemName",
      key: "itemName",
      width: "15%",
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
      render: (value, record) => {
        const itemDetails = getInventoryItemInfoFromItem(record);
        return (
          <span>
            <strong style={{ fontSize: "16px" }}>{value || 0}</strong>{" "}
            {itemDetails?.measurementUnit}
          </span>
        );
      },
    },
    {
      title: "Vị trí",
      dataIndex: "storedLocationName",
      key: "storedLocationName",
      width: "17%",
      render: (location) => formatLocation(location),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: "14%",
      render: (status) => getStatusTag(status),
    },
    {
      title: "QR",
      key: "qrAction",
      align: "center",
      width: "10%",
      render: (_, record) => (
        <Button type="default" onClick={() => openQrModal(record)}>
          Xem QR
        </Button>
      ),
    },
    {
      title: "Chi tiết",
      key: "detail",
      align: "center",
      width: "10%",
      render: (_, record) => (
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

  // ===== 9. SUB-COMPONENTS =====
  const InventoryTree = ({ historyData, selectedId, onSelectItem }) => {
    const rootItems = historyData.filter((item) => !item.parentId);

    const childrenMap = {};
    historyData.forEach((item) => {
      if (item.parentId) {
        if (!childrenMap[item.parentId]) {
          childrenMap[item.parentId] = [];
        }
        childrenMap[item.parentId].push(item);
      }
    });

    const renderTreeNode = (item, level = 0) => {
      const children = childrenMap[item.id] || [];
      const isSelected = selectedId === item.id;

      return (
        <div key={item.id} style={{ marginLeft: level * 20 }}>
          <div
            className={`p-3 mb-2 border rounded cursor-pointer transition-all ${
              isSelected
                ? "bg-blue-50 border-blue-300 shadow-sm"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
            }`}
            onClick={() => onSelectItem(item)}
          >
            <div className="flex items-center gap-2">
              {level > 0 && <span className="text-gray-400">└─</span>}
              <div className="flex-1">
                <div className="font-medium text-sm">{item.id}</div>
                <div className="text-xs text-gray-600">
                  {getStatusTag(item.status)} • {item.measurementValue || 0}{" "}
                  {getInventoryItemInfoFromItem(item)?.measurementUnit}
                </div>
              </div>
              {children.length > 0 && (
                <Badge count={children.length} size="small" />
              )}
            </div>
          </div>

          {children.map((child) => renderTreeNode(child, level + 1))}
        </div>
      );
    };

    return (
      <div className="max-h-60 overflow-y-auto">
        {rootItems.map((item) => renderTreeNode(item))}
      </div>
    );
  };

  InventoryTree.propTypes = {
    historyData: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        parentId: PropTypes.string,
        status: PropTypes.string,
        measurementValue: PropTypes.number,
      })
    ).isRequired,
    selectedId: PropTypes.string,
    onSelectItem: PropTypes.func.isRequired,
  };

  // ===== 10. LOADING STATE =====
  if (isInitialLoading) {
    return (
      <Card className="shadow-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // ===== 11. MAIN RENDER =====
  return (
    <div>
      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Quản lý hàng tồn kho</h1>
          <Button
            onClick={() => fetchData(true)}
            loading={inventoryLoading}
            icon={<ReloadOutlined />}
          >
            Làm mới dữ liệu
          </Button>
        </div>

        <div className="mb-4 space-y-4">
          {/* Search và Filter buttons */}
          <div className="flex items-center gap-4">
            <span className="font-medium">Mã sản phẩm:</span>
            <Input
              placeholder="Tìm kiếm theo mã sản phẩm..."
              value={searchInput}
              onChange={handleSearchChange}
              prefix={<SearchOutlined />}
              style={{ width: 400 }}
              allowClear
              onClear={() => {
                setSearchInput("");
                setSearchTerm("");
              }}
            />

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
                  {/* Item Name Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tên mặt hàng
                    </label>
                    <Input
                      placeholder="Tìm theo tên mặt hàng..."
                      value={filters.itemName}
                      onChange={(e) =>
                        handleFilterChange("itemName", e.target.value)
                      }
                      allowClear
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Trạng thái
                    </label>
                    <Select
                      mode="multiple"
                      placeholder="Chọn trạng thái"
                      value={filters.status}
                      onChange={(value) => handleFilterChange("status", value)}
                      style={{ width: "100%" }}
                      maxTagCount={2}
                    >
                      {statusOptions.map((option) => (
                        <Select.Option key={option.value} value={option.value}>
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
                      Giá trị đo lường
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
                          formatter: (value) => `${value}`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{getMeasurementRange()[0]}</span>
                        <span>{getMeasurementRange()[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Date Range Filter */}
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

                  {/* Quick Stats */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium mb-2">
                      Kết quả lọc
                    </label>
                    <div className="bg-white p-3 rounded border">
                      <span className="text-lg font-semibold text-blue-600">
                        {filteredItems.length}
                      </span>
                      <span className="text-sm text-gray-500">
                        / {allInventoryItems.length} sản phẩm{" "}
                        {/* Đổi từ inventoryItems thành allInventoryItems */}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={displayedItems}
          rowKey="id"
          className="custom-table"
          loading={inventoryLoading || itemsLoading}
          onChange={handleTableChange}
          pagination={{
            ...pagination,
            total: filteredItems.length,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `${range?.[0] || 0}-${range?.[1] || 0} của ${total} sản phẩm`,
          }}
        />
      </Card>

      {/* Modal hiển thị chi tiết inventory item */}
      <Modal
        title="Chi tiết sản phẩm"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setHistoryData([]);
          setSelectedInventoryItem(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setModalVisible(false);
              setHistoryData([]);
              setSelectedInventoryItem(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={1050}
      >
        {selectedInventoryItem && (
          <div className="space-y-4">
            {/* Hiển thị tree nếu có parent/children */}
            {historyData.length > 1 && (
              <Card title="Cây gia phả sản phẩm" size="small">
                {loadingHistory ? (
                  <div className="text-center py-4">Đang tải...</div>
                ) : (
                  <InventoryTree
                    historyData={historyData}
                    selectedId={selectedInventoryItem.id}
                    onSelectItem={setSelectedInventoryItem}
                  />
                )}
              </Card>
            )}

            {/* Chi tiết sản phẩm được chọn */}
            <Card title={`Chi tiết: ${selectedInventoryItem.id}`} size="small">
              <Descriptions bordered column={2}>
                {/* Những field quan trọng - chiếm full width */}
                <Descriptions.Item label="Mã sản phẩm" span={2}>
                  {selectedInventoryItem.id}
                </Descriptions.Item>
                <Descriptions.Item label="Sản phẩm kế thừa từ" span={2}>
                  {selectedInventoryItem.parentId || "Không có"}
                </Descriptions.Item>
                <Descriptions.Item label="Sản phẩm con" span={2}>
                  {selectedInventoryItem.childrenIds &&
                  selectedInventoryItem.childrenIds.length > 0
                    ? selectedInventoryItem.childrenIds.join(", ")
                    : "Không có"}
                </Descriptions.Item>

                {/* Những field khác - chia 2 cột */}
                <Descriptions.Item label="Tên mặt hàng">
                  {selectedInventoryItem.itemName}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {getStatusTag(selectedInventoryItem.status)}
                </Descriptions.Item>

                <Descriptions.Item label="Giá trị đo lường">
                  <strong style={{ fontSize: "16px" }}>
                    {selectedInventoryItem.measurementValue || 0}
                  </strong>{" "}
                  {
                    getInventoryItemInfoFromItem(selectedInventoryItem)
                      ?.measurementUnit
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Vị trí lưu trữ">
                  {formatLocation(selectedInventoryItem.storedLocationName)}
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

                <Descriptions.Item label="Ngày cập nhật" span={2}>
                  {selectedInventoryItem.updatedDate
                    ? new Date(
                        selectedInventoryItem.updatedDate
                      ).toLocaleDateString("vi-VN")
                    : "-"}
                </Descriptions.Item>

                {selectedInventoryItem.reasonForDisposal && (
                  <Descriptions.Item
                    label="Lý do đổi trạng thái thủ công"
                    span={2}
                  >
                    {selectedInventoryItem.reasonForDisposal}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </div>
        )}
      </Modal>
      <Modal
        title="QR sản phẩm"
        open={qrModalVisible}
        onCancel={closeQrModal}
        footer={[
          <Button key="close" onClick={closeQrModal}>
            Đóng
          </Button>,
        ]}
        width={600}
      >
        {qrItem && (
          <div className="space-y-3 text-sm mt-5">
            <div>
              <span className="font-medium">Mã hàng:</span> <br />
              <span style={{ fontSize: "23px", fontWeight: "bold" }}>
                {qrItem.id}
              </span>
            </div>
            <div>
              <span className="font-medium">Vị trí:</span>{" "}
              {formatLocation(qrItem.storedLocationName)}
            </div>
            <div>
              <span className="font-medium">Giá trị đo lường:</span>{" "}
              <strong style={{ fontSize: "16px", fontWeight: "bold" }}>
                {qrItem.measurementValue || 0}
              </strong>{" "}
              {getInventoryItemInfoFromItem(qrItem)?.measurementUnit}
            </div>
            <div className="flex justify-center pt-2">
              <QRCode
                value={qrItem.id?.toString() ?? ""}
                size={192}
                style={{ width: 192, height: 192 }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryItemList;
