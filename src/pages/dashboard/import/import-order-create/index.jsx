import React, { useState, useEffect, useCallback } from "react";
import { Button, Input, Select, Table, Typography, Space, Card, DatePicker, TimePicker, Alert, message, Upload } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import useImportOrderService from "../../../../hooks/useImportOrderService";
import useImportRequestService from "../../../../hooks/useImportRequestService";
import useImportOrderDetailService from "../../../../hooks/useImportOrderDetailService";
import { toast } from "react-toastify";
import moment from "moment";
import { useSelector } from "react-redux";
import { DEPARTMENT_ROUTER } from "../../../../constants/routes";
import { InfoCircleOutlined, UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx"

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const ImportOrderCreate = () => {
  const { importRequestId: paramImportRequestId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);

  const [importRequests, setImportRequests] = useState([]);
  const [selectedImportRequest, setSelectedImportRequest] = useState(null);
  const [importRequestDetails, setImportRequestDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadedDetails, setUploadedDetails] = useState([]);

  // Add pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [formData, setFormData] = useState({
    importRequestId: null,
    accountId: user?.id || 1, // Get user ID from Redux store
    dateReceived: moment().format("YYYY-MM-DD"),
    timeReceived: moment().format("HH:mm:ss"),
    note: "",
    status: "NOT_STARTED" // Using the enum from useImportOrderService
  });

  const {
    loading: importOrderLoading,
    createImportOrder,
  } = useImportOrderService();

  const {
    loading: importRequestLoading,
    getAllImportRequests,
    getImportRequestDetails,
    getImportRequestById
  } = useImportRequestService();

  const {
    loading: importOrderDetailLoading,
    uploadImportOrderDetail
  } = useImportOrderDetailService();

  // Fetch import requests
  useEffect(() => {
    const fetchImportRequests = async () => {
      try {
        const data = await getAllImportRequests();
        setImportRequests(data || []);

        // If importRequestId is provided in URL params, select it
        if (paramImportRequestId) {
          setSelectedImportRequest(Number(paramImportRequestId));
          setFormData(prev => ({
            ...prev,
            importRequestId: Number(paramImportRequestId)
          }));

          // Fetch the import request details for the selected request
          const requestDetails = await getImportRequestById(Number(paramImportRequestId));
          if (requestDetails) {
            // You might want to display some info about the selected request
            toast.info(`Đang tạo đơn nhập cho phiếu nhập #${paramImportRequestId}`);
          }
        }
      } catch (error) {
        console.error("Error fetching import requests:", error);
        toast.error("Không thể lấy danh sách phiếu nhập");
      }
    };

    fetchImportRequests();
  }, [paramImportRequestId]);

  // Fetch import request details when a request is selected
  useEffect(() => {
    if (selectedImportRequest) {
      fetchImportRequestDetails();
    }
  }, []);

  const fetchImportRequestDetails = useCallback(async () => {
    if (!selectedImportRequest) return;

    try {
      setDetailsLoading(true);
      const { current, pageSize } = pagination;
      const response = await getImportRequestDetails(
        parseInt(selectedImportRequest),
        current,
        pageSize
      );

      if (response && response.content) {
        // Add a plannedQuantity field to each item, initially set to the expectQuantity
        const detailsWithPlannedQuantity = response.content.map(detail => ({
          ...detail,
          plannedQuantity: detail.expectQuantity // Default value
        }));

        setImportRequestDetails(detailsWithPlannedQuantity);

        // Update pagination with metadata from response
        setPagination(prev => ({
          ...prev,
          current: response.metaDataDTO.page,
          pageSize: response.metaDataDTO.limit,
          total: response.metaDataDTO.total,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch import request details:", error);
      message.error("Không thể tải danh sách chi tiết phiếu nhập");
    } finally {
      setDetailsLoading(false);
    }
  }, [selectedImportRequest, pagination.current, pagination.pageSize, getImportRequestDetails]);

  const handleImportRequestChange = (value) => {
    setSelectedImportRequest(value);
    setPagination(prev => ({
      ...prev,
      current: 1 // Reset to first page when changing import request
    }));
    setFormData(prev => ({
      ...prev,
      importRequestId: value
    }));
    // Reset uploaded details when changing import request
    setUploadedDetails([]);
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      dateReceived: date ? date.format("YYYY-MM-DD") : null
    });
  };

  const handleTimeChange = (time) => {
    setFormData({
      ...formData,
      timeReceived: time ? time.format("HH:mm:ss") : null
    });
  };

  const handleSubmit = async () => {
    if (!formData.importRequestId) {
      toast.error("Vui lòng chọn phiếu nhập");
      return;
    }

    if (!formData.dateReceived || !formData.timeReceived) {
      toast.error("Vui lòng chọn ngày và giờ nhận hàng");
      return;
    }

    try {
      // Create import order
      const createdOrder = await createImportOrder(formData);

      if (createdOrder) {
        // If we have an Excel file with planned quantities, upload it
        if (excelFile) {
          await uploadImportOrderDetail(excelFile, createdOrder.importOrderId);
        }

        toast.success("Tạo đơn nhập kho thành công!");

        // Navigate to the import order list or detail page
        navigate(DEPARTMENT_ROUTER.IMPORT.ORDER.LIST_FROM_IMPORT_REQUEST_ID(selectedImportRequest));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Có lỗi xảy ra khi tạo đơn nhập kho");
    }
  };

  const handleTableChange = (pagination) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total
    });
  };

  const handleExcelUpload = async (info) => {
    const { status, originFileObj } = info.file;

    if (status !== 'uploading') {
      console.log('Uploading:', info.file, info.fileList);
    }

    if (status === 'done') {
      setExcelFile(originFileObj);
      message.success(`${info.file.name} tải lên thành công.`);

      // Parse the Excel file to extract planned quantities
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const ab = event.target.result;
          const wb = XLSX.read(ab, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(ws);

          // Validate and transform the data
          if (jsonData.length === 0) {
            toast.error("File Excel không có dữ liệu");
            return;
          }

          // Check if the Excel file has the required columns
          const firstRow = jsonData[0];
          const hasItemId = 'itemId' in firstRow || 'Mã hàng' in firstRow;
          const hasQuantity = 'quantity' in firstRow || 'Số lượng' in firstRow;

          if (!hasItemId || !hasQuantity) {
            toast.error("File Excel phải có cột 'itemId'/'Mã hàng' và 'quantity'/'Số lượng'");
            return;
          }

          // Map Excel data to match our format
          const excelDetails = jsonData.map(row => {
            const itemId = row.itemId || row['Mã hàng'];
            const quantity = row.quantity || row['Số lượng'];

            return {
              itemId: Number(itemId),
              plannedQuantity: Number(quantity)
            };
          });

          // Update the importRequestDetails with planned quantities from Excel
          const updatedDetails = importRequestDetails.map(detail => {
            const excelDetail = excelDetails.find(ed => ed.itemId === detail.itemId);
            if (excelDetail) {
              return {
                ...detail,
                plannedQuantity: excelDetail.plannedQuantity
              };
            }
            return detail;
          });

          setUploadedDetails(updatedDetails);
          toast.info("Số lượng dự tính đã được cập nhật từ file Excel");
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          toast.error("Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.");
        }
      };
      reader.readAsArrayBuffer(originFileObj);
    } else if (status === 'error') {
      message.error(`${info.file.name} tải lên thất bại.`);
    }
  };

  const columns = [
    {
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
    },
    {
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
      width: "30%"
    },
    {
      title: "Số lượng yêu cầu",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
    },
    // Update the column definition for "Số lượng sẽ nhập (dự tính)"
    {
      title: "Số lượng sẽ nhập (dự tính)",
      dataIndex: "plannedQuantity",
      key: "plannedQuantity",
      render: (text, record) => {
        // If we have uploaded details, show the planned quantity
        // Otherwise, show the expected quantity as default
        const uploadedDetail = uploadedDetails.find(d => d.itemId === record.itemId);
        const plannedQuantity = uploadedDetail ? uploadedDetail.plannedQuantity : "Chưa có";

        // Apply styling to make it stand out
        return (
          <span
            className="font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-md"
            style={{ display: 'inline-block' }}
          >
            {plannedQuantity}
          </span>
        );
      }
    }

  ];

  const loading = importOrderLoading || importRequestLoading || importOrderDetailLoading;

  // Excel upload props
  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx, .xls',
    customRequest: ({ file, onSuccess }) => {
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    },
    onChange: handleExcelUpload,
  };

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Tạo đơn nhập kho</Title>
      </div>

      <div className="flex gap-6">
        <Card title="Thông tin đơn nhập" className="w-2/5">
          <Space direction="vertical" className="w-full">
            <div>
              <label className="block mb-1">Chọn phiếu nhập <span className="text-red-500">*</span></label>
              <Select
                placeholder="Chọn phiếu nhập"
                value={selectedImportRequest}
                onChange={handleImportRequestChange}
                className="w-full"
                disabled={!!paramImportRequestId} // Disable if importRequestId is provided in URL
              >
                {importRequests.map((request) => (
                  <Option key={request.importRequestId} value={request.importRequestId}>
                    Phiếu nhập #{request.importRequestId} - {request.importReason?.substring(0, 30)}
                    {request.importReason?.length > 30 ? "..." : ""}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block mb-1">Ngày nhận <span className="text-red-500">*</span></label>
              <DatePicker
                className="w-full"
                value={formData.dateReceived ? moment(formData.dateReceived) : null}
                onChange={handleDateChange}
              />
            </div>

            <div>
              <label className="block mb-1">Giờ nhận <span className="text-red-500">*</span></label>
              <TimePicker
                className="w-full"
                value={formData.timeReceived ? moment(formData.timeReceived, "HH:mm:ss") : null}
                onChange={handleTimeChange}
                format="HH:mm:ss"
              />
            </div>

            <div>
              <label className="block mb-1">Ghi chú</label>
              <TextArea
                placeholder="Nhập ghi chú"
                rows={4}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full"
              />
            </div>

            {selectedImportRequest && (
              <>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block mb-2 font-medium text-blue-700">Tải lên file Excel số lượng dự tính</label>
                  <Upload {...uploadProps}>
                    <Button icon={<UploadOutlined />} className="bg-blue-100 hover:bg-blue-200 border-blue-300">Chọn file Excel</Button>
                  </Upload>
                  <div className="text-sm text-blue-600 mt-2 flex items-center">
                    <InfoCircleOutlined className="mr-1" />
                    File Excel phải có cột itemId và quantity
                  </div>
                </div>
              </>
            )}

            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              className="w-full mt-4"
              id="btn-detail"
              disabled={!selectedImportRequest || !excelFile}
            >
              Xác nhận tạo đơn nhập
            </Button>
          </Space>
        </Card>

        <div className="w-3/5">
          <Card title={`Chi tiết hàng hóa cần nhập từ phiếu nhập  #${selectedImportRequest}`}>
            {importRequestDetails.length > 0 ? (
              <Table
                columns={columns}
                dataSource={importRequestDetails}
                rowKey="importRequestDetailId"
                loading={detailsLoading}
                onChange={handleTableChange}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  showTotal: (total) => `Tổng cộng ${total} sản phẩm trong phiếu nhập`,
                }}
              />
            ) : (
              <div className="text-center py-10 text-gray-500">
                {selectedImportRequest
                  ? "Không có dữ liệu chi tiết cho phiếu nhập này"
                  : "Vui lòng chọn phiếu nhập để xem chi tiết"}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImportOrderCreate;
