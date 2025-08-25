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
} from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
const { TextArea } = Input;
import useItemService from "@/services/useItemService";
import useCategoryService from "@/services/useCategoryService";
import useProviderService from "@/services/useProviderService";
import useInventoryItemService, {
  ItemStatus,
} from "@/services/useInventoryItemService";
import { AccountRole } from "@/utils/enums";

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

  const { getItemById } = useItemService();
  const { getCategoryById } = useCategoryService();
  const { getProviderById } = useProviderService();
  const { getInventoryItemById, updateInventoryItem, getInventoryItemFigure } =
    useInventoryItemService();

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

  useEffect(() => {
    if (id && canViewInventoryInfo()) {
      fetchInventoryFigure();
    }
  }, [id, userRole]);

  const canViewInventoryInfo = () => {
    return (
      userRole === AccountRole.MANAGER || userRole === AccountRole.DEPARTMENT
    );
  };

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

      // Refresh inventory items
      if (item?.inventoryItemIds) {
        await fetchInventoryItems(item.inventoryItemIds);
      }

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
        return <Tag color="error">Thanh lý</Tag>;
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
      align: "center",
      width: "15%",
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
              <Descriptions.Item label="Số lượng tồn kho">
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
            title="Tổng quan hàng tồn kho"
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

                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {inventoryFigure.totalInventoryItemNeedLiquid}
                  </div>
                  <div className="text-sm text-orange-700 font-medium">
                    Cần thanh lý
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

                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-gray-600 mb-1">
                    {inventoryFigure.totalInventoryItemNoLongerExist}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    Không tồn tại
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
    </div>
  );
};

export default ItemDetail;
