import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Input, Table, Typography, Space, Card, DatePicker, TimePicker, message, Upload } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import useImportOrderService, { ImportOrderCreateRequest, ImportStatus } from "@/hooks/useImportOrderService";
import useImportRequestService, { ImportRequestResponse } from "@/hooks/useImportRequestService";
import useImportOrderDetailService from "@/hooks/useImportOrderDetailService";
import useImportRequestDetailService, { ImportRequestDetailResponse } from "@/hooks/useImportRequestDetailService";
import { toast } from "react-toastify";
import dayjs, { Dayjs } from "dayjs";
import { useSelector } from "react-redux";
import { InfoCircleOutlined, UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx"
import { ROUTES } from "@/constants/routes";
import { RootState } from "@/redux/store";

const { Title } = Typography;
const { TextArea } = Input;


interface FormData extends Omit<ImportOrderCreateRequest, 'dateReceived' | 'timeReceived'> {
  dateReceived: string;
  timeReceived: string;
  status: ImportStatus;
}

interface UploadedDetail {
  itemId: number;
  plannedQuantity: number;
}

interface ImportRequestDetailWithPlanned extends ImportRequestDetailResponse {
  plannedQuantity: number;
}

interface TablePagination {
  current: number;
  pageSize: number;
  total: number;
}

const ImportOrderCreate = () => {
  const { importRequestId: paramImportRequestId } = useParams<{ importRequestId: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);

  const [importRequests, setImportRequests] = useState<ImportRequestResponse[]>([]);
  const [selectedImportRequest, setSelectedImportRequest] = useState<number | null>(null);
  const [importRequestDetails, setImportRequestDetails] = useState<ImportRequestDetailWithPlanned[]>([]);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploadedDetails, setUploadedDetails] = useState<UploadedDetail[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add pagination state
  const [pagination, setPagination] = useState<TablePagination>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [formData, setFormData] = useState<FormData>({
    importRequestId: null,
    accountId: null,
    dateReceived: dayjs().format("YYYY-MM-DD"),
    timeReceived: dayjs().format("HH:mm"),
    note: "",
    status: ImportStatus.NOT_STARTED // Using the enum from useImportOrderService
  });


  const {
    loading: importRequestLoading,
    getAllImportRequests,
    getImportRequestById
  } = useImportRequestService();

  const {
    loading: importRequestDetailLoading,
    getImportRequestDetails,
  } = useImportRequestDetailService();

  const {
    loading: importOrderLoading,
    createImportOrder,
  } = useImportOrderService();

  const {
    loading: importOrderDetailLoading,
    createImportOrderDetails: uploadImportOrderDetail
  } = useImportOrderDetailService();

  // Fetch import requests
  useEffect(() => {
    const fetchImportRequests = async () => {
      try {
        const response = await getAllImportRequests();
        if (response?.content) {
          setImportRequests(response.content);

          if (paramImportRequestId) {
            const importRequestIdNum = Number(paramImportRequestId);
            setSelectedImportRequest(importRequestIdNum);
            setFormData(prev => ({
              ...prev,
              importRequestId: importRequestIdNum
            }))
          }
        }
      } catch (error) {
        console.error("Error fetching import requests:", error);
      }
    };

    fetchImportRequests();
  }, [paramImportRequestId]);

  // Fetch import request details when a request is selected
  useEffect(() => {
    if (selectedImportRequest) {
      fetchImportRequestDetails();
    }
  }, [selectedImportRequest, pagination.current, pagination.pageSize]);

  const fetchImportRequestDetails = useCallback(async () => {
    if (!selectedImportRequest) return;

    try {
      setDetailsLoading(true);
      const { current, pageSize } = pagination;
      const response = await getImportRequestDetails(
        selectedImportRequest,
        current,
        pageSize
      );

      if (response?.content) {
        const detailsWithPlannedQuantity = response.content.map(detail => ({
          ...detail,
          plannedQuantity: detail.expectQuantity
        }));

        setImportRequestDetails(detailsWithPlannedQuantity);

        if (response.metadata) {
          setPagination(prev => ({
            ...prev,
            current: response.metadata.page,
            pageSize: response.metadata.limit,
            total: response.metadata.total,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch import request details:", error);
      message.error("Không thể tải danh sách chi tiết phiếu nhập");
    } finally {
      setDetailsLoading(false);
    }
  }, [selectedImportRequest, pagination.current, pagination.pageSize, getImportRequestDetails]);


  const handleDateChange = (date: Dayjs | null) => {
    setFormData({
      ...formData,
      dateReceived: date ? date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")
    });
  };

  const handleTimeChange = (time: Dayjs | null) => {
    setFormData({
      ...formData,
      timeReceived: time ? time.format("HH:mm") : dayjs().format("HH:mm")
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
      const createOrderRequest: ImportOrderCreateRequest = {
        importRequestId: formData.importRequestId,
        accountId: formData.accountId,
        dateReceived: formData.dateReceived,
        timeReceived: formData.timeReceived,
        note: formData.note
      };

      const response = await createImportOrder(createOrderRequest);

      if (response?.content) {
        if (excelFile) {
          await uploadImportOrderDetail(excelFile, response.content.importOrderId);
        }
        navigate(ROUTES.PROTECTED.IMPORT.ORDER.LIST_FROM_REQUEST(selectedImportRequest.toString()));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleTableChange = (newPagination: TablePagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: newPagination.total
    });
  };

  const downloadTemplate = () => {
    const template = [
      {
        "itemId": "Mã hàng (số)",
        "quantity": "Số lượng (số)"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "import_order_template.xlsx");
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setExcelFile(uploadedFile);
    setFileName(uploadedFile.name);

      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const ab = event.target?.result;
        if (ab instanceof ArrayBuffer) {
          const wb = XLSX.read(ab, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(ws);

            if (jsonData.length === 0) {
              toast.error("File Excel không có dữ liệu");
              return;
            }

            const firstRow = jsonData[0] as Record<string, any>;
            const hasItemId = 'itemId' in firstRow || 'Mã hàng' in firstRow;
            const hasQuantity = 'quantity' in firstRow || 'Số lượng' in firstRow;

            if (!hasItemId || !hasQuantity) {
              toast.error("File Excel phải có cột 'itemId'/'Mã hàng' và 'quantity'/'Số lượng'");
              return;
            }

            const excelDetails = jsonData.map((row: Record<string, any>) => ({
              itemId: Number(row.itemId || row['Mã hàng']),
              plannedQuantity: Number(row.quantity || row['Số lượng'])
            }));

            // Validate if itemId exists in importRequestDetails
            const invalidItems = excelDetails.filter(ed =>
              !importRequestDetails.some(ird => ird.itemId === ed.itemId)
            );

            if (invalidItems.length > 0) {
              toast.error(`Các mã hàng sau không tồn tại trong phiếu nhập: ${invalidItems.map(i => i.itemId).join(', ')}`);
              setExcelFile(null);
            setFileName("");
              return;
            }

            const updatedDetails = importRequestDetails.map(detail => {
              const excelDetail = excelDetails.find(ed => ed.itemId === detail.itemId);
              return excelDetail ? { ...detail, plannedQuantity: excelDetail.plannedQuantity } : detail;
            });

            setUploadedDetails(excelDetails);
            toast.info("Số lượng dự tính đã được cập nhật từ file Excel");
          }
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          toast.error("Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.");
          setExcelFile(null);
        setFileName("");
        }
      };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
      title: "Số lượng đã lên đơn nhập",
      dataIndex: "orderedQuantity",
      key: "orderedQuantity",
    },
    // Update the column definition for "Số lượng sẽ nhập (dự tính)"
    {
      title: "Số lượng sẽ nhập (dự tính)",
      dataIndex: "plannedQuantity",
      key: "plannedQuantity",
      render: (_: any, record: ImportRequestDetailWithPlanned) => {
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

  const loading = importOrderLoading || importRequestLoading || importOrderDetailLoading || importRequestDetailLoading;

  const renderExcelUploadSection = () => (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <label className="block mb-2 font-medium text-blue-700">Tải lên file Excel số lượng dự tính</label>
      
      {/* Button group container */}
      <div className="flex flex-col gap-3">
        {/* Buttons row */}
        <div className="flex gap-3">
          <Button
            icon={<DownloadOutlined />}
            onClick={downloadTemplate}
          >
            Tải mẫu Excel
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            style={{ display: "none" }}
          />
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={triggerFileInput}
            className="bg-blue-100 hover:bg-blue-200 border-blue-300"
          >
            Tải lên file Excel
          </Button>
        </div>

        {/* File name display */}
        {fileName && (
          <div className="flex items-center bg-white px-3 py-2 rounded-md border border-gray-200">
            <span className="text-gray-600">
              File đã chọn: <span className="font-medium text-gray-800">{fileName}</span>
            </span>
          </div>
        )}
      </div>

      {/* Info message */}
      <div className="text-sm text-blue-600 mt-3 flex items-center">
        <InfoCircleOutlined className="mr-1" />
        File Excel phải có cột itemId và quantity, và chỉ chứa các mã hàng có trong phiếu nhập
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Tạo đơn nhập kho</Title>
      </div>

      <div className="flex gap-6">
        <Card title="Thông tin đơn nhập" className="w-3/10">
          <Space direction="vertical" className="w-full">
            <div>
              <div className="text-gray-700 py-1 font-bold text-md">
                {importRequests.find(request => request.importRequestId === selectedImportRequest)
                  ? `Phiếu nhập #${selectedImportRequest} - ${importRequests.find(request => request.importRequestId === selectedImportRequest).importReason}`
                  : 'Chưa chọn phiếu nhập'}
              </div>
            </div>

            <div>
              <label className="block mb-1">Ngày nhận <span className="text-red-500">*</span></label>
              <DatePicker
                className="w-full"
                value={formData.dateReceived ? dayjs(formData.dateReceived) : null}
                onChange={handleDateChange}
              />
            </div>

            <div>
              <label className="block mb-1">Giờ nhận <span className="text-red-500">*</span></label>
              <TimePicker
                className="w-full"
                value={formData.timeReceived ? dayjs(`1970-01-01 ${formData.timeReceived}`) : null}
                onChange={handleTimeChange}
                format="HH:mm"
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

            {selectedImportRequest && renderExcelUploadSection()}

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

        <div className="w-7/10">
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
