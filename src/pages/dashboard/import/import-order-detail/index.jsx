import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Card,
  Descriptions,
  Tag,
  Spin,
  message,
  Upload,
  Modal,
  Form,
  InputNumber,
  Select,
  Space
} from "antd";
import {
  ArrowLeftOutlined,
  UploadOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined
} from "@ant-design/icons";
import useImportOrderService from "../../../../hooks/useImportOrderService";
import useImportOrderDetailService from "../../../../hooks/useImportOrderDetailService";
import { ImportStatus } from "../../../../hooks/useImportOrderService";

const ImportOrderDetail = () => {
  const { importOrderId } = useParams();
  const navigate = useNavigate();
  const [importOrder, setImportOrder] = useState(null);
  const [importOrderDetails, setImportOrderDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [form] = Form.useForm();
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const { getImportOrderById, updateImportOrderStatus } = useImportOrderService();
  const {
    getImportOrderDetailsPaginated,
    uploadImportOrderDetail,
    updateImportOrderDetails
  } = useImportOrderDetailService();

  // Fetch import order data
  const fetchImportOrderData = useCallback(async () => {
    if (!importOrderId) return;

    try {
      setLoading(true);
      const data = await getImportOrderById(parseInt(importOrderId));
      setImportOrder(data);
    } catch (error) {
      console.error("Failed to fetch import order:", error);
      message.error("Không thể tải thông tin đơn nhập");
    } finally {
      setLoading(false);
    }
  }, [importOrderId, getImportOrderById]);

  // Fetch import order details with pagination
  const fetchImportOrderDetails = useCallback(async () => {
    if (!importOrderId) return;

    try {
      setDetailsLoading(true);
      const { current, pageSize } = pagination;
      const response = await getImportOrderDetailsPaginated(
        parseInt(importOrderId),
        current,
        pageSize
      );

      if (response) {
        setImportOrderDetails(response);

        // Update pagination with metadata from response
        if (response.metaDataDTO) {
          setPagination(prev => ({
            ...prev,
            current: response.metaDataDTO.page,
            pageSize: response.metaDataDTO.limit,
            total: response.metaDataDTO.total,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch import order details:", error);
      message.error("Không thể tải danh sách chi tiết đơn nhập");
    } finally {
      setDetailsLoading(false);
    }
  }, [importOrderId, pagination, getImportOrderDetailsPaginated]);

  useEffect(() => {
    fetchImportOrderData();
  }, []);

  // Load details when pagination changes
  useEffect(() => {
    fetchImportOrderDetails();
  }, []);

  // Status tag renderers
  const getStatusTag = (status) => {
    const statusMap = {
      "NOT_STARTED": { color: "default", text: "Chưa bắt đầu" },
      "IN_PROGRESS": { color: "processing", text: "Đang xử lý" },
      "COMPLETED": { color: "success", text: "Hoàn tất" },
      "CANCELLED": { color: "error", text: "Đã hủy" }
    };

    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getDetailStatusTag = (status) => {
    const statusMap = {
      "NOT_STARTED": { color: "default", text: "Chưa bắt đầu" },
      "IN_PROGRESS": { color: "processing", text: "Đang xử lý" },
      "COMPLETED": { color: "success", text: "Hoàn tất" },
      "CANCELLED": { color: "error", text: "Đã hủy" }
    };

    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // Table pagination handler
  const handleTableChange = (pagination) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Handle upload modal
  const showUploadModal = () => {
    setIsUploadModalVisible(true);
  };

  const handleUploadCancel = () => {
    setIsUploadModalVisible(false);
    setFileList([]);
  };

  const handleUploadOk = async () => {
    if (fileList.length === 0) {
      message.warning("Vui lòng chọn file để tải lên");
      return;
    }

    try {
      await uploadImportOrderDetail(fileList[0].originFileObj, parseInt(importOrderId));
      setIsUploadModalVisible(false);
      setFileList([]);
      fetchImportOrderDetails();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      // Check if file is Excel
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                      file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error('Chỉ chấp nhận file Excel!');
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false;
    },
    fileList,
  };

  // Editing functionality
  const isEditing = (record) => record.importOrderDetailId === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      ...record,
    });
    setEditingKey(record.importOrderDetailId);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...importOrderDetails];
      const index = newData.findIndex(item => key === item.importOrderDetailId);
      
      if (index > -1) {
        const item = newData[index];
        const updatedItem = { ...item, ...row };
        
        // Prepare data for API
        const updateData = [{
          itemId: updatedItem.itemId,
          quantity: updatedItem.expectQuantity,
          actualQuantity: updatedItem.actualQuantity
        }];
        
        await updateImportOrderDetails(parseInt(importOrderId), updateData);
        
        // Update local state
        newData.splice(index, 1, updatedItem);
        setImportOrderDetails(newData);
        setEditingKey('');
        
        // Refresh data
        fetchImportOrderDetails();
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  // Update import order status
  const handleUpdateStatus = async (newStatus) => {
    try {
      await updateImportOrderStatus(parseInt(importOrderId), newStatus);
      message.success(`Cập nhật trạng thái thành công: ${getStatusTag(newStatus).props.children}`);
      fetchImportOrderData();
    } catch (error) {
      console.error("Failed to update status:", error);
      message.error("Không thể cập nhật trạng thái");
    }
  };

  // Table columns definition
  const columns = [
    {
      title: "Mã chi tiết",
      dataIndex: "importOrderDetailId",
      key: "importOrderDetailId",
      render: (id) => `#${id}`,
      width: '10%',
    },
    {
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      width: '10%',
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "itemName",
      key: "itemName",
      ellipsis: true,
      width: '20%',
    },
    {
      title: "Số lượng dự kiến",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
      width: '15%',
      editable: true,
    },
    {
      title: "Số lượng thực tế",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      width: '15%',
      editable: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: getDetailStatusTag,
      width: '15%',
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button 
              type="primary" 
              onClick={() => save(record.importOrderDetailId)}
              icon={<SaveOutlined />}
            >
              Lưu
            </Button>
            <Button onClick={cancel} icon={<CloseOutlined />}>Hủy</Button>
          </Space>
        ) : (
          <Button 
            disabled={editingKey !== '' || importOrder?.status === ImportStatus.COMPLETED || importOrder?.status === ImportStatus.CANCELLED} 
            onClick={() => edit(record)}
            icon={<EditOutlined />}
          >
            Sửa
          </Button>
        );
      },
      width: '15%',
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'actualQuantity' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {
    const inputNode = inputType === 'number' ? <InputNumber min={0} /> : <InputNumber min={0} disabled />;
    
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: `Vui lòng nhập ${title}!`,
              },
            ]}
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  // Show loading spinner when initially loading the page
  if (loading && !importOrder) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="mx-auto p-5">
      <div className="flex items-center mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="mr-4"
        >
          Quay lại
        </Button>
        <h1 className="text-xl font-bold m-0">Chi tiết đơn nhập #{importOrder?.importOrderId}</h1>
      </div>

      <Card className="mb-6">
        <Descriptions title="Thông tin đơn nhập" bordered>
          <Descriptions.Item label="Mã đơn nhập">#{importOrder?.importOrderId}</Descriptions.Item>
          <Descriptions.Item label="Mã phiếu nhập">#{importOrder?.importRequestId}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">{getStatusTag(importOrder?.status)}</Descriptions.Item>
          <Descriptions.Item label="Ngày nhận hàng">
            {importOrder?.dateReceived ? new Date(importOrder?.dateReceived).toLocaleDateString("vi-VN") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Giờ nhận hàng">
            {importOrder?.timeReceived || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Người tạo">{importOrder?.createdBy || "-"}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {importOrder?.createdDate ? new Date(importOrder?.createdDate).toLocaleDateString("vi-VN") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày cập nhật">
            {importOrder?.updatedDate ? new Date(importOrder?.updatedDate).toLocaleDateString("vi-VN") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Ghi chú" span={3}>
            {importOrder?.note || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <div className="flex justify-between items-center mt-16 mb-4">
        {/* <h2 className="text-lg font-semibold">Danh sách chi tiết sản phẩm</h2>
        <div className="space-x-3">
          {importOrder?.status !== ImportStatus.COMPLETED && importOrder?.status !== ImportStatus.CANCELLED && (
            <>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={showUploadModal}
              >
                Tải lên danh sách sản phẩm
              </Button>
              <Select
                placeholder="Cập nhật trạng thái"
                style={{ width: 200 }}
                onChange={handleUpdateStatus}
                value={importOrder?.status}
              >
                <Select.Option value={ImportStatus.NOT_STARTED}>Chưa bắt đầu</Select.Option>
                <Select.Option value={ImportStatus.IN_PROGRESS}>Đang xử lý</Select.Option>
                <Select.Option value={ImportStatus.COMPLETED}>Hoàn tất</Select.Option>
                <Select.Option value={ImportStatus.CANCELLED}>Đã hủy</Select.Option>
              </Select>
            </>
          )}
        </div> */}
      </div>

      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          columns={mergedColumns}
          dataSource={importOrderDetails}
          rowKey="importOrderDetailId"
          loading={detailsLoading}
          onChange={handleTableChange}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '50'],
            showTotal: (total) => `Tổng cộng ${total} sản phẩm trong đơn nhập`,
          }}
        />
      </Form>

      {/* Upload Modal */}
      <Modal
        title="Tải lên danh sách sản phẩm"
        visible={isUploadModalVisible}
        onOk={handleUploadOk}
        onCancel={handleUploadCancel}
        okText="Tải lên"
        cancelText="Hủy"
      >
        <p className="mb-4">Tải lên file Excel chứa danh sách sản phẩm cho đơn nhập này.</p>
        <Upload {...uploadProps} maxCount={1}>
          <Button icon={<UploadOutlined />}>Chọn file Excel</Button>
        </Upload>
        <p className="mt-2 text-gray-500 text-sm">
          Lưu ý: Chỉ chấp nhận file Excel (.xlsx, .xls)
        </p>
      </Modal>
    </div>
  );
};

export default ImportOrderDetail;
