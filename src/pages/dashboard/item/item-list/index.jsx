import { useState, useEffect } from "react";
import { Table, Input, message, Button } from "antd";
import { Link } from "react-router-dom";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { AccountRole } from "@/utils/enums";
import { ROUTES } from "@/constants/routes";
import { useCallback } from "react";
import { debounce } from "lodash";
import useItemService from "@/services/useItemService";
import useInventoryItemService from "@/services/useInventoryItemService";
import useCategoryService from "@/services/useCategoryService";
import useProviderService from "@/services/useProviderService";

const ItemList = () => {
  const [allItems, setAllItems] = useState([]); // Lưu toàn bộ data
  const [displayedItems, setDisplayedItems] = useState([]); // Data hiển thị
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [allInventoryItems, setAllInventoryItems] = useState([]);
  const [categories, setCategories] = useState({});
  const [providers, setProviders] = useState({});

  const userRole = useSelector((state) => state.user.role);

  const { getItems } = useItemService();
  const { getAllInventoryItems } = useInventoryItemService();
  const { getCategoryById } = useCategoryService();
  const { getProviderById } = useProviderService();

  const debouncedSearch = useCallback(
    debounce((searchValue, allItemsData, allInventoryData) => {
      let filtered = allItemsData;

      if (searchValue.trim()) {
        // Tìm item trực tiếp theo tên và ID
        const directMatches = allItemsData.filter(
          (item) =>
            item.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
            item.id?.toLowerCase().includes(searchValue.toLowerCase())
        );

        // Chỉ search inventory khi có dữ liệu
        let itemsFromInventory = [];
        if (allInventoryData.length > 0) {
          const matchingInventoryItems = allInventoryData.filter((invItem) =>
            invItem.id?.toLowerCase().includes(searchValue.toLowerCase())
          );

          const itemIdsFromInventory = [
            ...new Set(
              matchingInventoryItems
                .map((invItem) => invItem.itemId)
                .filter(Boolean)
            ),
          ];

          itemsFromInventory = allItemsData.filter((item) =>
            itemIdsFromInventory.includes(item.id)
          );
        }

        // Gộp kết quả và loại bỏ trùng lặp
        const allMatches = [...directMatches, ...itemsFromInventory];
        filtered = allMatches.filter(
          (item, index, array) =>
            array.findIndex((i) => i.id === item.id) === index
        );
      }

      // Client-side pagination
      const startIndex = (pagination.current - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      const paginatedItems = filtered.slice(startIndex, endIndex);

      setDisplayedItems(paginatedItems);
      setPagination((prev) => ({
        ...prev,
        total: filtered.length,
      }));
    }, 300), // Delay 300ms
    [pagination.current, pagination.pageSize]
  );

  // Lấy toàn bộ data một lần
  const fetchAllItems = async () => {
    try {
      setLoading(true);

      // Step 1: Load items trước (nhanh hơn)
      const itemsResponse = await getItems(1, 200);
      let itemsData = [];

      if (itemsResponse && itemsResponse.content) {
        itemsData = itemsResponse.content;
        setPagination((prev) => ({
          ...prev,
          total: itemsResponse.content.length,
        }));
      } else if (Array.isArray(itemsResponse)) {
        itemsData = itemsResponse;
        setPagination((prev) => ({
          ...prev,
          total: itemsResponse.length,
        }));
      }

      // Hiển thị items ngay lập tức
      setAllItems(itemsData);

      // Step 2: Load inventory items trong background (không block UI)
      setTimeout(async () => {
        try {
          const inventoryResponse = await getAllInventoryItems(1, 5000);
          if (inventoryResponse && inventoryResponse.content) {
            setAllInventoryItems(inventoryResponse.content);
          }
        } catch (error) {
          console.error("Error loading inventory items:", error);
          // Không hiện message error để không làm phiền user
        }
      }, 100); // Delay 100ms để UI render trước

      // Step 3: Load categories và providers nếu là ADMIN (cũng trong background)
      if (userRole === AccountRole.ADMIN && itemsData.length > 0) {
        setTimeout(async () => {
          try {
            // Fetch categories
            const uniqueCategoryIds = [
              ...new Set(
                itemsData.map((item) => item.categoryId).filter(Boolean)
              ),
            ];

            // Batch process categories (xử lý từng batch 10 items)
            const categoryBatches = [];
            for (let i = 0; i < uniqueCategoryIds.length; i += 10) {
              categoryBatches.push(uniqueCategoryIds.slice(i, i + 10));
            }

            const categoriesMap = {};
            for (const batch of categoryBatches) {
              const categoryPromises = batch.map(async (categoryId) => {
                try {
                  const response = await getCategoryById(categoryId);
                  return { id: categoryId, data: response.content };
                } catch (error) {
                  return { id: categoryId, data: null };
                }
              });

              const batchResults = await Promise.all(categoryPromises);
              batchResults.forEach(({ id, data }) => {
                categoriesMap[id] = data;
              });

              // Update categories từng batch
              setCategories((prev) => ({ ...prev, ...categoriesMap }));

              // Delay giữa các batch để tránh quá tải
              await new Promise((resolve) => setTimeout(resolve, 50));
            }

            // Fetch providers tương tự
            const allProviderIds = [
              ...new Set(itemsData.flatMap((item) => item.providerIds || [])),
            ];

            const providerBatches = [];
            for (let i = 0; i < allProviderIds.length; i += 10) {
              providerBatches.push(allProviderIds.slice(i, i + 10));
            }

            const providersMap = {};
            for (const batch of providerBatches) {
              const providerPromises = batch.map(async (providerId) => {
                try {
                  const response = await getProviderById(providerId);
                  return { id: providerId, data: response.content };
                } catch (error) {
                  return { id: providerId, data: null };
                }
              });

              const batchResults = await Promise.all(providerPromises);
              batchResults.forEach(({ id, data }) => {
                providersMap[id] = data;
              });

              // Update providers từng batch
              setProviders((prev) => ({ ...prev, ...providersMap }));

              // Delay giữa các batch
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          } catch (error) {
            console.error("Error loading additional data:", error);
          }
        }, 200); // Delay 200ms
      }
    } catch (error) {
      message.error("Không thể tải danh sách hàng hóa");
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false); // Tắt loading ngay sau khi load xong items
    }
  };

  useEffect(() => {
    fetchAllItems();
  }, []);

  useEffect(() => {
    debouncedSearch(searchTerm, allItems, allInventoryItems);
  }, [searchTerm, allItems, allInventoryItems, debouncedSearch]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Reset về trang 1 khi search
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const renderProviders = (providerIds) => {
    if (!providerIds || providerIds.length === 0) {
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
        {providerIds.map((providerId) => {
          const provider = providers[providerId];
          const displayName = provider
            ? formatProviderName(provider.name)
            : `Provider ${providerId}`;
          return <div key={providerId}>• {displayName}</div>;
        })}
      </div>
    );
  };

  const columns =
    userRole === AccountRole.ADMIN
      ? [
          {
            title: "Mã hàng",
            dataIndex: "id",
            key: "id",
            render: (text, record) => <span>#{text}</span>,
          },
          {
            title: "Tên hàng",
            dataIndex: "name",
            key: "name",
          },
          {
            title: "Danh mục hàng",
            dataIndex: "categoryId",
            key: "categoryId",
            align: "center",
            render: (categoryId) => {
              const category = categories[categoryId];
              return category ? category.name : "Không xác định";
            },
          },
          {
            title: "Giá trị đo lường",
            key: "measurementValue",
            render: (text, record) => (
              <span>
                <strong style={{ fontSize: "16px" }}>
                  {record.measurementValue || 0}
                </strong>{" "}
                {record?.measurementUnit} {"/"} {record?.unitType}
              </span>
            ),
          },
          {
            title: "Nhà cung cấp",
            dataIndex: "providerIds",
            key: "providerIds",
            render: (providerIds) => renderProviders(providerIds),
          },
          {
            title: "Chi tiết",
            key: "detail",
            align: "center",
            render: (text, record) => (
              <Link to={`/item/detail/${record.id}`}>
                <span
                  className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer"
                  style={{ width: 32, height: 32 }}
                >
                  <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
                </span>
              </Link>
            ),
          },
        ]
      : [
          {
            title: "Mã hàng",
            dataIndex: "id",
            key: "id",
            render: (text, record) => <span>#{text}</span>,
          },
          {
            title: "Tên hàng",
            dataIndex: "name",
            key: "name",
          },
          {
            title: "Số lượng tồn kho",
            dataIndex: "quantity",
            key: "quantity",
            align: "left",
            render: (text, record) => (
              <span>
                <strong style={{ fontSize: "17px" }}>{text || "0"}</strong>{" "}
                {record.unitType}
              </span>
            ),
          },
          {
            title: "Số lượng khả dụng",
            key: "availableQuantity",
            align: "left",
            render: (text, record) => {
              const availableQty = Math.max(
                0,
                (record.numberOfAvailableItems || 0) -
                  (record.minimumStockQuantity || 0)
              );
              return (
                <span>
                  <strong style={{ fontSize: "17px" }}>{availableQty}</strong>{" "}
                  {record.unitType}
                </span>
              );
            },
          },
          {
            title: "Giá trị tồn kho",
            dataIndex: "totalMeasurementValue",
            key: "totalMeasurementValue",
            align: "left",
            render: (text, record) => (
              <span>
                <strong style={{ fontSize: "17px" }}>{text || "0"}</strong>{" "}
                {record.measurementUnit}
              </span>
            ),
          },
          {
            title: "Giá trị khả dụng",
            key: "availableValue",
            align: "left",
            render: (text, record) => {
              const availableValue = Math.max(
                0,
                (record.numberOfAvailableMeasurementValues || 0) -
                  (record.minimumStockQuantity || 0) *
                    (record.measurementValue || 0)
              );
              return (
                <span>
                  <strong style={{ fontSize: "17px" }}>{availableValue}</strong>{" "}
                  {record.measurementUnit}
                </span>
              );
            },
          },
          {
            title: "Chi tiết",
            key: "detail",
            align: "center",
            render: (text, record) => (
              <Link to={`/item/detail/${record.id}`}>
                <span
                  className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer"
                  style={{ width: 32, height: 32 }}
                >
                  <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
                </span>
              </Link>
            ),
          },
        ];

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Danh sách hàng hóa</h1>
        {userRole === AccountRole.ADMIN && (
          <Link to={ROUTES.PROTECTED.ITEM.CREATE}>
            <Button type="primary" id="btn-create" icon={<PlusOutlined />}>
              Tạo mặt hàng mới
            </Button>
          </Link>
        )}
      </div>

      <Input
        placeholder="Tìm kiếm theo mã hàng, tên hàng hoặc mã sản phẩm tồn kho"
        value={searchTerm}
        onChange={handleSearchChange}
        className="!mb-4"
        allowClear
      />

      <Table
        columns={columns}
        dataSource={displayedItems}
        rowKey="id"
        className="custom-table"
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} mục`,
        }}
      />
    </div>
  );
};

export default ItemList;
