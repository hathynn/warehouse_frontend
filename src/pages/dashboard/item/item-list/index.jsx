import { useState, useEffect } from "react";
import { Table, Input, message } from "antd";
import { Link } from "react-router-dom";
import useItemService from "@/services/useItemService";
import useInventoryItemService from "@/services/useInventoryItemService";
import { EyeOutlined } from "@ant-design/icons";

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

  const { getItems } = useItemService();
  const { getAllInventoryItems } = useInventoryItemService();

  useEffect(() => {
    fetchAllItems();
  }, []);

  // Lấy toàn bộ data một lần
  const fetchAllItems = async () => {
    try {
      setLoading(true);

      // Lấy cả items và inventory items
      const [itemsResponse, inventoryResponse] = await Promise.all([
        getItems(1, 9999),
        getAllInventoryItems(1, 9999),
      ]);

      if (itemsResponse && itemsResponse.content) {
        setAllItems(itemsResponse.content);
        setPagination((prev) => ({
          ...prev,
          total: itemsResponse.content.length,
        }));
      } else if (Array.isArray(itemsResponse)) {
        setAllItems(itemsResponse);
        setPagination((prev) => ({
          ...prev,
          total: itemsResponse.length,
        }));
      }

      // Lưu inventory items để search
      if (inventoryResponse && inventoryResponse.content) {
        setAllInventoryItems(inventoryResponse.content);
      }
    } catch (error) {
      message.error("Không thể tải danh sách hàng hóa");
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search và pagination
  useEffect(() => {
    let filtered = allItems;

    if (searchTerm) {
      // Tìm item trực tiếp theo tên và ID
      const directMatches = allItems.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Tìm inventory items phù hợp với search term
      const matchingInventoryItems = allInventoryItems.filter((invItem) =>
        invItem.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Lấy itemId từ các inventory items phù hợp
      const itemIdsFromInventory = [
        ...new Set(
          matchingInventoryItems
            .map((invItem) => invItem.itemId)
            .filter(Boolean)
        ),
      ];

      // Tìm items có ID trong danh sách itemIdsFromInventory
      const itemsFromInventory = allItems.filter((item) =>
        itemIdsFromInventory.includes(item.id)
      );

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
  }, [
    allItems,
    allInventoryItems,
    searchTerm,
    pagination.current,
    pagination.pageSize,
  ]);

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

  const columns = [
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
            (record.minimumStockQuantity || 0) * (record.measurementValue || 0)
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Danh sách hàng hóa</h1>
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
