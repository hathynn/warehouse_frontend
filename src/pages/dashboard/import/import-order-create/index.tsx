import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Input, Table, Typography, Space, Card, DatePicker, TimePicker, message, Upload } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import useImportOrderService, { ImportOrderCreateRequest, ImportStatus } from "@/hooks/useImportOrderService";
import useImportRequestService, { ImportRequestResponse } from "@/hooks/useImportRequestService";
import useImportOrderDetailService from "@/hooks/useImportOrderDetailService";
import useImportRequestDetailService, { ImportRequestDetailResponse } from "@/hooks/useImportRequestDetailService";
import useConfigurationService from "@/hooks/useConfigurationService";
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
  const { getConfiguration } = useConfigurationService();
  const [configuration, setConfiguration] = useState<{ createRequestTimeAtLeast: string } | null>(null);
  const [defaultDateTime, setDefaultDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: ""
  });

  // Add function to get default date/time based on configuration
  const getDefaultDateTime = useCallback(() => {
    const now = dayjs();
    const hours = configuration ? parseInt(configuration.createRequestTimeAtLeast.split(':')[0]) : 12;
    const defaultTime = now.add(hours, 'hour').add(30, 'minute');
    return {
      date: defaultTime.format("YYYY-MM-DD"),
      time: defaultTime.format("HH:mm")
    };
  }, [configuration]);

  // Fetch configuration on component mount
  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        const config = await getConfiguration();
        if (config) {
          setConfiguration(config);
        }
      } catch (error) {
        console.error("Error fetching configuration:", error);
      }
    };
    fetchConfiguration();
  }, []);

  // Update defaultDateTime when configuration changes
  useEffect(() => {
    if (configuration) {
      setDefaultDateTime(getDefaultDateTime());
    }
  }, [configuration, getDefaultDateTime]);

  // Update formData when defaultDateTime changes
  useEffect(() => {
    if (defaultDateTime.date && defaultDateTime.time) {
      setFormData(prev => ({
        ...prev,
        dateReceived: defaultDateTime.date,
        timeReceived: defaultDateTime.time
      }));
    }
  }, [defaultDateTime]);

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
    dateReceived: defaultDateTime.date,
    timeReceived: defaultDateTime.time,
    note: "",
    status: ImportStatus.NOT_STARTED
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
      console.error("Failed to fetch import request details:", error);
      message.error("Không thể tải danh sách chi tiết phiếu nhập");
    } finally {
      setDetailsLoading(false);
    }
  }, [selectedImportRequest, pagination.current, pagination.pageSize, getImportRequestDetails]);


  const validateDateTime = (date: string, time: string) => {
    const selectedDateTime = dayjs(`${date} ${time}`);
    const now = dayjs();
    const hours = configuration ? parseInt(configuration.createRequestTimeAtLeast.split(':')[0]) : 12;
    const minDateTime = now.add(hours, 'hour');

    return selectedDateTime.isAfter(minDateTime);
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (!date) return;
    
    const newDate = date.format("YYYY-MM-DD");
    setFormData(prev => ({
      ...prev,
      dateReceived: newDate
    }));
  };

  const handleTimeChange = (time: Dayjs | null) => {
    if (!time) return;
    
    const newTime = time.format("HH:mm");
    setFormData(prev => ({
      ...prev,
      timeReceived: newTime
    }));
  };

  const handleSubmit = async () => {
    if (!formData.importRequestId) {
      toast.error("Vui lòng chọn phiếu nhập");
      return;
    }

    const hours = configuration ? parseInt(configuration.createRequestTimeAtLeast.split(':')[0]) : 12;
    if (!validateDateTime(formData.dateReceived, formData.timeReceived)) {
      toast.error(`Thời gian nhập hàng phải cách thời điểm hiện tại ít nhất ${hours} giờ`);
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
          // Create a new file with only valid items
          const validData = uploadedDetails.map(detail => ({
            itemId: detail.itemId,
            quantity: detail.plannedQuantity
          }));

          const ws = XLSX.utils.json_to_sheet(validData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Valid Items");
          const validFile = new File([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], 
            'valid_items.xlsx', 
            { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
          );

          await uploadImportOrderDetail(validFile, response.content.importOrderId);
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

            // Filter out invalid items and only keep those that exist in importRequestDetails
            const validExcelDetails = excelDetails.filter(ed =>
              importRequestDetails.some(ird => ird.itemId === ed.itemId)
            );

            if (validExcelDetails.length === 0) {
              toast.warning("Không có mã hàng nào trong file Excel khớp với phiếu nhập");
              setExcelFile(null);
              setFileName("");
              return;
            }

            // Update only the valid items
            const updatedDetails = importRequestDetails.map(detail => {
              const excelDetail = validExcelDetails.find(ed => ed.itemId === detail.itemId);
              return excelDetail ? { ...detail, plannedQuantity: excelDetail.plannedQuantity } : detail;
            });

            setUploadedDetails(validExcelDetails);
            toast.success(`Đã cập nhật số lượng dự tính cho ${validExcelDetails.length} mã hàng từ file Excel`);
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
            <span className="text-gray-600 truncate max-w-[300px]" title={fileName}>
              File đã chọn: <span className="font-medium text-gray-800">{fileName}</span>
            </span>
          </div>
        )}
      </div>

      {/* Info message */}
      <div className="text-sm text-blue-600 mt-3 flex items-center">
        <InfoCircleOutlined className="mr-1" />
        Hệ thống sẽ bỏ qua các itemId (Mã hàng) không tồn tại trong phiếu nhập
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
                disabledDate={(current) => {
                  const hours = configuration ? parseInt(configuration.createRequestTimeAtLeast.split(':')[0]) : 12;
                  return current && current.isBefore(dayjs().add(hours, 'hour').startOf('day'));
                }}
                showNow={false}
              />
            </div>

            <div>
              <label className="block mb-1">Giờ nhận <span className="text-red-500">*</span></label>
              <TimePicker
                className="w-full"
                value={formData.timeReceived ? dayjs(`1970-01-01 ${formData.timeReceived}`) : null}
                onChange={handleTimeChange}
                format="HH:mm"
                showNow={false}
                disabledTime={() => {
                  const now = dayjs();
                  const selectedDate = dayjs(formData.dateReceived);
                  const hours = configuration ? parseInt(configuration.createRequestTimeAtLeast.split(':')[0]) : 12;
                  const minDateTime = now.add(hours, 'hour');
                  
                  if (selectedDate.isSame(minDateTime, 'day')) {
                    return {
                      disabledHours: () => Array.from({ length: minDateTime.hour() }, (_, i) => i),
                      disabledMinutes: () => {
                        if (minDateTime.hour() === now.hour()) {
                          return Array.from({ length: minDateTime.minute() }, (_, i) => i);
                        }
                        return [];
                      }
                    };
                  }
                  return {};
                }}
              />
              <div className="text-sm text-red-500 mt-1">
                <InfoCircleOutlined className="mr-1" />
                Giờ nhận phải cách thời điểm hiện tại ít nhất {configuration ? parseInt(configuration.createRequestTimeAtLeast.split(':')[0]) : 12} giờ
              </div>
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
