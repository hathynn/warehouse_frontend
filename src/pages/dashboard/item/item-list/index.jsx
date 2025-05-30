import { useState, useEffect } from "react";
import { Table, Button, Input, message } from "antd";
import { Link } from "react-router-dom";
import useItemService from "@/services/useItemService";

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  const { getItems } = useItemService();

  useEffect(() => {
    fetchItems();
  }, [pagination.current, pagination.pageSize]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const response = await getItems(current, pageSize);
      
      if (response && response.content) {
        setItems(response.content);
        
        // Update pagination with metadata from response
        setPagination(prev => ({
          ...prev,
          current: response.metaDataDTO.page,
          pageSize: response.metaDataDTO.limit,
          total: response.metaDataDTO.total,
        }));
      } else if (Array.isArray(response)) {
        // Fallback for API that returns array without pagination metadata
        setItems(response);
        setPagination(prev => ({
          ...prev,
          total: response.length,
        }));
      }
    } catch (error) {
      message.error("Không thể tải danh sách hàng hóa");
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTableChange = (pagination) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const filteredItems = items.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Mã hàng",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Tên hàng",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Đơn vị tính",
      dataIndex: "measurementUnit",
      key: "measurementUnit",
    },
    {
      title: "Loại đơn vị",
      dataIndex: "unitType",
      key: "unitType",
    },
    {
      title: "Số lượng tối thiểu",
      dataIndex: "minimumStockQuantity",
      key: "minimumStockQuantity",
      render: (text) => text || "Chưa thiết lập",
    },
    {
      title: "Số lượng tối đa",
      dataIndex: "maximumStockQuantity",
      key: "maximumStockQuantity",
      render: (text) => text || "Chưa thiết lập",
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (text, record) => (
        <Link to={`/dashboard/items/${record.id}`}>
          <Button id="btn-detail" className="!p-2 !text-white !font-bold !bg-blue-900 hover:!bg-blue-500" type="link">
            Xem chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Danh sách hàng hóa</h1>
        <div className="space-x-2">
          <Link to="add-product">
            <Button type="primary" className="btn" id="btn-detail">
              Thêm hàng hóa
            </Button>
          </Link>
          <Link to="request-list">
            <Button className="btn" id="btn-detail">
              Danh sách phiếu nhập
            </Button>
          </Link>
        </div>
      </div>

      <Input
        placeholder="Tìm kiếm tên hàng"
        value={searchTerm}
        onChange={handleSearchChange}
        className="!mb-4"
      />

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        className="custom-table"
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
        }}
      />
    </div>
  );
};

export default ItemList;
