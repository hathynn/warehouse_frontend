import React, { useState, useEffect } from "react";
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
} from "antd";
import { ArrowLeftOutlined, EyeOutlined } from "@ant-design/icons";
import useItemService from "@/services/useItemService";
import useCategoryService from "@/services/useCategoryService";
import useProviderService from "@/services/useProviderService";
import useInventoryItemService, {
  ItemStatus,
} from "@/services/useInventoryItemService";

const ItemDetail = () => {
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

  const { getItemById } = useItemService();
  const { getCategoryById } = useCategoryService();
  const { getProviderById } = useProviderService();
  const { getInventoryItemById } = useInventoryItemService();

  useEffect(() => {
    if (id) {
      fetchItemDetail();
    }
  }, [id]);

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

        if (
          response.content.inventoryItemIds &&
          response.content.inventoryItemIds.length > 0
        ) {
          // Gọi ngay với inventoryItemIds từ response
          fetchInventoryItems(response.content.inventoryItemIds);
        }
      }
    } catch (error) {
      message.error("Không thể tải thông tin sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async (inventoryItemIds) => {
    if (!inventoryItemIds || inventoryItemIds.length === 0) {
      return;
    }

    try {
      setInventoryLoading(true);
      const inventoryPromises = inventoryItemIds.map(async (inventoryId) => {
        try {
          const response = await getInventoryItemById(inventoryId);
          return response.content;
        } catch (error) {
          console.error(`Error fetching inventory item ${inventoryId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(inventoryPromises);
      const validItems = results.filter((item) => item !== null);
      setInventoryItems(validItems);
      setFilteredInventoryItems(validItems); // Thêm dòng này
      setInventoryPagination((prev) => ({
        ...prev,
        total: validItems.length,
      }));
    } catch (error) {
      message.error("Không thể tải danh sách hàng tồn kho");
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredInventoryItems(inventoryItems);
    } else {
      const filtered = inventoryItems.filter((item) =>
        item.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInventoryItems(filtered);

      // Update pagination total
      setInventoryPagination((prev) => ({
        ...prev,
        current: 1, // Reset to first page when searching
        total: filtered.length,
      }));
    }
  }, [inventoryItems, searchTerm]);

  const calculateAvailableQuantity = () => {
    if (!item) return 0;
    return Math.max(
      0,
      (item.numberOfAvailableItems || 0) - (item.minimumStockQuantity || 0)
    );
  };

  const calculateAvailableValue = () => {
    if (!item) return 0;
    return Math.max(
      0,
      (item.numberOfAvailableMeasurementValues || 0) -
        (item.minimumStockQuantity || 0) * (item.measurementValue || 0)
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
    setSearchTerm(e.target.value);
  };

  const handleViewInventoryDetail = (inventoryItem) => {
    setSelectedInventoryItem(inventoryItem);
    setModalVisible(true);
  };

  const handleInventoryTableChange = (pagination) => {
    setInventoryPagination(pagination);
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
        return <Tag color="error">Thanh lý</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const inventoryColumns = [
    {
      title: "Mã sản phẩm",
      dataIndex: "id",
      key: "id",
      width: "30%",
    },
    {
      title: "Giá trị đo lường",
      key: "measurementValue",
      render: (text, record) => (
        <span>
          <strong style={{ fontSize: "16px" }}>
            {record.measurementValue || 0}
          </strong>{" "}
          {item?.measurementUnit}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Ngày nhập",
      dataIndex: "importedDate",
      key: "importedDate",
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

        <h1 className="text-2xl font-bold mb-4">
          Chi tiết mặt hàng: {`${item.name} (${item.id})`}
        </h1>
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

          <Descriptions.Item label="Giá trị đo lường">
            <strong style={{ fontSize: "16px" }}>
              {item.measurementValue || 0}
            </strong>{" "}
            {item?.measurementUnit} {"/"} {item?.unitType}
          </Descriptions.Item>

          <Descriptions.Item label="Danh mục hàng">
            {category ? category.name : "Không xác định"}
          </Descriptions.Item>

          <Descriptions.Item label="Số lượng tồn kho">
            <strong style={{ fontSize: "18px" }}>{item.quantity || 0}</strong>{" "}
            {item.unitType}
          </Descriptions.Item>

          <Descriptions.Item label="Số lượng khả dụng">
            <strong style={{ fontSize: "18px" }}>
              {calculateAvailableQuantity()}
            </strong>{" "}
            {item.unitType}
          </Descriptions.Item>

          <Descriptions.Item label="Giá trị tồn kho">
            <strong style={{ fontSize: "18px" }}>
              {item.totalMeasurementValue || 0}
            </strong>{" "}
            {item.measurementUnit}
          </Descriptions.Item>

          <Descriptions.Item label="Giá trị khả dụng">
            <strong style={{ fontSize: "18px" }}>
              {calculateAvailableValue()}
            </strong>{" "}
            {item.measurementUnit}
          </Descriptions.Item>

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

      <div className="mt-5">
        <Card
          title="Danh sách hàng tồn kho thuộc mặt hàng"
          className="shadow-lg mt-6"
        >
          <div className="mb-4 flex items-center gap-4">
            <span className="font-medium">Mã sản phẩm:</span>
            <Input
              placeholder="Tìm kiếm theo mã sản phẩm..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{ width: 400 }}
              allowClear
            />
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
              {selectedInventoryItem.storedLocationName || "Không xác định"}
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
    </div>
  );
};

export default ItemDetail;
