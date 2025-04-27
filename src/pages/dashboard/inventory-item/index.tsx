import React, { useState, useEffect } from "react";
import { Table, Input, Tag, TablePaginationConfig } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import useInventoryItemService, { InventoryItemResponse, ItemStatus } from "@/hooks/useInventoryItemService";
import useItemService, { ItemResponse } from "@/hooks/useItemService";
import { toast } from "react-toastify";

const InventoryItemList: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const { getAllInventoryItems, loading: inventoryLoading } = useInventoryItemService();
  const { getItems, loading: itemsLoading } = useItemService();

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const fetchData = async (): Promise<void> => {
    try {
      const [inventoryResponse, itemsResponse] = await Promise.all([
        getAllInventoryItems(pagination.current || 1, pagination.pageSize || 10),
        getItems()
      ]);
      
      if (inventoryResponse && itemsResponse?.content) {
        setInventoryItems(inventoryResponse.content);
        setItems(itemsResponse.content);
        setPagination(prev => ({
          ...prev,
          total: inventoryResponse.metaDataDTO?.total || 0,
          current: inventoryResponse.metaDataDTO?.page || 1,
          pageSize: inventoryResponse.metaDataDTO?.limit || 10,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleTableChange = (newPagination: TablePaginationConfig): void => {
    setPagination({
      ...newPagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const getStatusTag = (status: ItemStatus): React.ReactNode => {
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
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getIventoryItemInfoFromItem = (inventoryItem: InventoryItemResponse) => {
    return items.find(item => item.id === inventoryItem.itemId);
  };

  const filteredItems = inventoryItems.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "id",
      key: "id",
      render: (id: number) => `#${id}`,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Số lượng",
      dataIndex: "measurementValue",
      key: "measurementValue",
    },
    {
      title: "Giá trị đo lường",
      key: "measurementValue",
      render: (_, record: InventoryItemResponse) => {
        const itemDetails = getIventoryItemInfoFromItem(record);
        return itemDetails?.totalMeasurementValue || 'N/A';
      },
    },
    {
      title: "Đơn vị tính",
      key: "measurementUnit",
      render: (_, record: InventoryItemResponse) => {
        const itemDetails = getIventoryItemInfoFromItem(record);
        return itemDetails?.measurementUnit || 'N/A';
      },
    },
    {
      title: "Vị trí",
      dataIndex: "storedLocationName",
      key: "storedLocationName",
      render: (location: string) => location || "Chưa có vị trí",
    },
    {
      title: "Ngày nhập",
      dataIndex: "importedDate",
      key: "importedDate",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "expiredDate",
      key: "expiredDate",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: ItemStatus) => getStatusTag(status),
    },
  ];

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Quản lý hàng tồn kho</h1>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Tìm kiếm theo tên hoặc mã sản phẩm"
          value={searchTerm}
          onChange={handleSearchChange}
          prefix={<SearchOutlined />}
          className="max-w-md"
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        className="custom-table"
        loading={inventoryLoading || itemsLoading}
        onChange={handleTableChange}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Tổng cộng ${total} sản phẩm`,
        }}
      />
    </div>
  );
};

export default InventoryItemList;