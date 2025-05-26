import { useState, useEffect, useCallback, useRef } from "react";
import useProviderService, { ProviderResponse } from "@/hooks/useProviderService";
import { Button, Input, Typography, Space, Card, DatePicker, TimePicker, message, Alert, Select, Modal, TablePaginationConfig, Table } from "antd";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import useImportOrderService, { ImportOrderCreateRequest } from "@/hooks/useImportOrderService";
import useImportRequestService, { ImportRequestResponse } from "@/hooks/useImportRequestService";
import useImportOrderDetailService from "@/hooks/useImportOrderDetailService";
import { ImportRequestDetailResponse } from "@/hooks/useImportRequestDetailService";
import useConfigurationService, { ConfigurationDto } from "@/hooks/useConfigurationService";
import { toast } from "react-toastify";
import dayjs, { Dayjs } from "dayjs";
import { ArrowLeftOutlined, ArrowRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { ROUTES } from "@/constants/routes";
import ExcelUploadSection from "@/components/commons/ExcelUploadSection";
import EditableImportOrderTableSection, { ImportOrderDetailRow } from "@/components/import-flow/EditableImportOrderTableSection";
import ImportOrderConfirmModal from "@/components/import-flow/ImportOrderConfirmModal";
import {
  getDefaultAssignedDateTimeForAction,
  isDateDisabledForAction,
  getDisabledTimeConfigForAction
} from "@/utils/helpers";

const { Title } = Typography;
const { TextArea } = Input;

// Convert Excel serial number to YYYY-MM-DD if needed
function excelDateToYMD(serial: number): string {
  // Excel epoch is 1899-12-30 (UTC)
  const excelEpoch = Date.UTC(1899, 11, 30);
  const ms = serial * 24 * 60 * 60 * 1000;
  const date = new Date(excelEpoch + ms);
  return date.toISOString().split('T')[0];
}

// Convert Excel serial number to HH:mm if needed
function excelTimeToHM(serial: number): string {
  const totalMinutes = Math.round(serial * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

const ImportOrderCreate = () => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { getAllProviders } = useProviderService();
  const [providers, setProviders] = useState<ProviderResponse[]>([]);
  const { importRequestId: paramImportRequestId } = useParams<{ importRequestId: string }>();
  const { importRequestDetails } = useLocation().state as { importRequestDetails: ImportRequestDetailResponse[] } || {};
  const navigate = useNavigate();
  const { getConfiguration } = useConfigurationService();
  const [configuration, setConfiguration] = useState<ConfigurationDto | null>(null);
  const [defaultDateTime, setDefaultDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: ""
  });
  const [importRequest, setImportRequest] = useState<ImportRequestResponse | null>(null);

  // Step state: 0 = upload/edit, 1 = confirm
  const [step, setStep] = useState<number>(0);
  // Remove status from form state, handle only in backend if needed

  // Editable table data for step 1
  const [editableRows, setEditableRows] = useState<ImportOrderDetailRow[]>([]); // No change needed here, still use ImportOrderDetailRow
  const [excelImported, setExcelImported] = useState<boolean>(false);
  const [isAllPagesViewed, setIsAllPagesViewed] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDefaultDateTimeForComponent = useCallback(() => {
    return getDefaultAssignedDateTimeForAction("import-order-create", configuration, undefined, importRequest || undefined);
  }, [configuration, importRequest]);

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 5,
    total: importRequestDetails.length,
  });

  const [formData, setFormData] = useState<ImportOrderCreateRequest>({
    importRequestId: null,
    accountId: null,
    dateReceived: defaultDateTime.date,
    timeReceived: defaultDateTime.time,
    note: ""
  });

  const {
    loading: importRequestLoading,
    getImportRequestById,
  } = useImportRequestService();

  const {
    loading: importOrderLoading,
    createImportOrder,
  } = useImportOrderService();

  const {
    loading: importOrderDetailLoading,
    createImportOrderDetails,
  } = useImportOrderDetailService();

  // Thêm state cho validation step 1
  const [isImportOrderDataValid, setIsImportOrderDataValid] = useState<boolean>(false);

  // Cập nhật giá trị isStep1Valid khi editableRows thay đổi
  useEffect(() => {
    const valid = editableRows.length > 0 && editableRows.every(row => {
      if (row.actualQuantity === 0) {
        return row.plannedQuantity <= (row.expectQuantity - row.orderedQuantity) &&
          row.plannedQuantity > 0
      }
      else {
        return row.plannedQuantity <= (row.expectQuantity - row.actualQuantity) &&
          row.plannedQuantity > 0
      }
    });
    setIsImportOrderDataValid(valid);
  }, [editableRows]);

  // Fetch providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await getAllProviders(1, 1000);;
        if (response && response.content) {
          setProviders(response.content);
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
      }
    };
    fetchProviders();
  }, []);

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

  useEffect(() => {
    if (configuration) {
      setDefaultDateTime(getDefaultDateTimeForComponent());
    }
  }, [configuration, getDefaultDateTimeForComponent]);

  useEffect(() => {
    if (defaultDateTime.date && defaultDateTime.time) {
      setFormData(prev => ({
        ...prev,
        dateReceived: defaultDateTime.date,
        timeReceived: defaultDateTime.time
      }));
    }
  }, [defaultDateTime]);

  useEffect(() => {
    const fetchImportRequest = async () => {
      try {
        const response = await getImportRequestById(paramImportRequestId!);
        if (response?.content) {
          setImportRequest(response.content);
          setFormData(prev => ({
            ...prev,
            importRequestId: paramImportRequestId!,
            providerId: response.content.providerId
          }))
        }
      } catch (error) {
        console.error("Error fetching import requests:", error);
      }
    };

    fetchImportRequest();
  }, [paramImportRequestId]);

  // Khi fetch xong chi tiết phiếu nhập, khởi tạo editableRows nếu chưa import Excel
  useEffect(() => {
    if (importRequestDetails.length && !excelImported) {
      setEditableRows(
        importRequestDetails
          .filter(row => {
            if (row.actualQuantity === 0) {
              return row.expectQuantity !== row.orderedQuantity;
            } else {
              return row.expectQuantity !== row.actualQuantity;
            }
          })
          .map(row => ({
            itemId: row.itemId,
            itemName: row.itemName,
            expectQuantity: row.expectQuantity,
            orderedQuantity: row.orderedQuantity,
            plannedQuantity: row.actualQuantity === 0
              ? row.expectQuantity - row.orderedQuantity
              : row.expectQuantity - row.actualQuantity,
            actualQuantity: row.actualQuantity,
            importRequestProviderId: importRequest?.providerId || 0,
          }))
      );
    }
  }, [importRequestDetails, importRequest, excelImported]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 5,
    });
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

    // Kiểm tra lại thời gian hết hạn trước khi tạo đơn nhập
    if (configuration && importRequest?.endDate) {
      const currentDateTime = dayjs();
      const importRequestEndDate = dayjs(importRequest.endDate).endOf('day');
      
      // Kiểm tra nếu ngày hiện tại là ngày kết thúc
      if (currentDateTime.isSame(importRequestEndDate, 'day')) {
        try {
          const minDateTime = getDefaultAssignedDateTimeForAction(
            'import-order-create',
            configuration,
            undefined,
            importRequest
          );
          
          // Nếu thời gian tối thiểu vượt quá ngày kết thúc, đã hết hạn
          if (dayjs(`${minDateTime.date} ${minDateTime.time}`).isAfter(importRequestEndDate)) {
            toast.error("Đã hết hạn tạo đơn nhập cho phiếu này!");
            // Chuyển về trang chi tiết phiếu nhập
            navigate(ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(importRequest.importRequestId));
            return;
          }
        } catch (error) {
          console.error("Error checking import order creation time:", error);
          message.error("Có lỗi xảy ra khi kiểm tra thời gian tạo đơn nhập!");
          return;
        }
      }
    }

    try {
      // 1. Tạo đơn nhập
      const createOrderRequest: ImportOrderCreateRequest = {
        importRequestId: formData.importRequestId,
        accountId: formData.accountId,
        dateReceived: formData.dateReceived,
        timeReceived: formData.timeReceived,
        note: formData.note
      };
      const response = await createImportOrder(createOrderRequest);
      if (response?.content) {
        // 2. Chỉ gửi các itemId có trong phiếu nhập
        const validItemIds = importRequestDetails.map(importRequestDetail => importRequestDetail.itemId);
        const importOrderItems = editableRows.filter(row => validItemIds.includes(row.itemId)).map(row => ({
          itemId: row.itemId,
          quantity: row.plannedQuantity
        }));
        await createImportOrderDetails(
          { providerId: importRequest?.providerId!, importOrderItems },
          response.content.importOrderId
        );
        // 3. Chuyển hướng về danh sách đơn nhập từ phiếu nhập
        navigate(ROUTES.PROTECTED.IMPORT.ORDER.LIST);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi tạo đơn nhập hoặc chi tiết đơn nhập");
      console.error("Error submitting form:", error);
    }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const ws: { [key: string]: any } = {};

    ws["A1"] = { v: "dateReceived", t: "s" };
    ws["B1"] = { v: "2025-04-30", t: "d" };

    ws["A2"] = { v: "timeReceived", t: "s" };
    ws["A2"] = { v: "timeReceived", t: "s" };
    // Giá trị mẫu: 08:30 (Excel lưu time tốt nhất ở dạng text, hoặc số thập phân phần lẻ của ngày)
    ws["B2"] = { v: "08:30", t: "s" };

    // Dòng 3: note
    ws["A3"] = { v: "note", t: "s" };
    ws["B3"] = { v: "", t: "s" };

    // Dòng 5: header bảng hàng hóa
    ws["A5"] = { v: "itemId", t: "s" };
    ws["B5"] = { v: "quantity", t: "s" };

    ws["!ref"] = "A1:B5";
    ws["!cols"] = [
      { wpx: 90 }, { wpx: 100 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "import_order_template.xlsx");
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        const ab = event.target?.result;
        if (ab instanceof ArrayBuffer) {
          const wb = XLSX.read(ab, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];

          // Read cells directly for new format
          const getCell = (cell: string) => ws[cell]?.v;

          // Get header fields
          const dateReceived = getCell('B1');
          const timeReceived = getCell('B2');
          const note = getCell('B3');

          // Validate header fields first
          if (!dateReceived || !timeReceived) {
            toast.error("File Excel phải có đủ thông tin ngày nhận và giờ nhận ở B1, B2");
            return;
          }

          // Get the range of the sheet
          if (!ws['!ref']) {
            toast.error("Không tìm thấy dữ liệu bảng trong file Excel (thiếu !ref).");
            return;
          }

          const range = XLSX.utils.decode_range(ws['!ref']);

          // Find headers in row 5
          const headers = [getCell('A5'), getCell('B5')];
          if (headers[0] !== 'itemId' || headers[1] !== 'quantity') {
            toast.error("File Excel phải có header hàng hóa ở dòng 5: itemId, quantity");
            return;
          }

          // Parse data from row 6 onwards
          const excelDetails: { itemId: number, quantity: number }[] = [];
          for (let row = 6; row <= range.e.r + 1; row++) {
            const itemId = getCell(`A${row}`);
            const quantity = getCell(`B${row}`);
            if (itemId && quantity) {
              excelDetails.push({
                itemId: Number(itemId),
                quantity: Number(quantity)
              });
            }
          }

          if (excelDetails.length === 0) {
            toast.warning("Không có dữ liệu hàng hóa hợp lệ trong file Excel");
            return;
          }

          // Only update state if all validations pass
          setFileName(uploadedFile.name);

          setFormData(prev => ({
            ...prev,
            dateReceived: typeof dateReceived === 'number' ? excelDateToYMD(dateReceived) : dateReceived,
            timeReceived: typeof timeReceived === 'number' ? excelTimeToHM(timeReceived) : timeReceived,
            note: note ? note.toString() : prev.note
          }));

          // Khi import file Excel, chỉ cập nhật plannedQuantity cho các itemId có trong Excel, giữ nguyên các dòng khác
          const updatedRows = editableRows.map(row => {
            const match = excelDetails.find(d => d.itemId === row.itemId);
            if (match) {
              return {
                ...row,
                plannedQuantity: match.quantity,
              };
            }
            return row;
          });

          setEditableRows(updatedRows);
          setExcelImported(true);
          toast.success(`Đã tải ${excelDetails.length} hàng hóa từ file Excel`);
        }
      } catch (error) {
        toast.error("Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.");
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const columns = [
    {
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (id: number) => `#${id}`,
    },
    {
      width: "30%",
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: "Dự nhập theo phiếu",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: "Thực tế đã nhập",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: "Dự nhập đơn này",
      dataIndex: "plannedQuantity",
      key: "plannedQuantity",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (_: any, record: ImportOrderDetailRow) => (
        <span className="font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-md inline-block" style={{ textAlign: 'right' }}>
          {record.plannedQuantity}
        </span>
      ),
    },
  ]

  const loading = importOrderLoading || importRequestLoading || importOrderDetailLoading;
  return (
    <div className="container mx-auto p-3 pt-0">
      <div className="flex items-center mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => step === 1 ? setStep(0) : navigate(ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(importRequest?.importRequestId))}
          className="mr-4"
        >
          Quay lại
        </Button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Tạo đơn nhập kho - {importRequest
          ? `Phiếu nhập #${importRequest.importRequestId}`
          : 'Chưa chọn phiếu nhập'}
        </Title>
      </div>

      {/* Step 1: Upload Excel + Editable Table */}
      {step === 0 && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-full">
            <ExcelUploadSection
              fileName={fileName}
              onFileChange={handleExcelUpload}
              onDownloadTemplate={downloadTemplate}
              fileInputRef={fileInputRef}
              buttonLabel="Tải lên file Excel"
            />
          </div>
          <div className="w-full">
            <EditableImportOrderTableSection
              data={editableRows}
              onChange={setEditableRows}
              title="Danh sách hàng hóa cần nhập"
              emptyText="Chưa có dữ liệu từ file Excel"
              excelImported={excelImported}
              setIsAllPagesViewed={setIsAllPagesViewed}
            />
          </div>
          <Button
            type="primary"
            className="mt-2"
            disabled={!isImportOrderDataValid || !isAllPagesViewed}
            onClick={() => setStep(1)}
          >
            Tiếp tục nhập thông tin đơn nhập
            {!isAllPagesViewed && isImportOrderDataValid && <span style={{ color: 'red', marginLeft: 4 }}>(Vui lòng xem tất cả các trang)</span>}
            <ArrowRightOutlined />
          </Button>
        </div>
      )}

      {/* Step 2: Show current form */}
      {step === 1 && (
        <div className="mt-4 flex gap-6">
          <Card title="Thông tin đơn nhập" className="w-3/10">
            <Space direction="vertical" className="w-full">
              <div className="mb-2">
                <label className="text-md font-semibold">Ngày nhận dự kiến<span className="text-red-500">*</span></label>
                <DatePicker
                  className="w-full"
                  format="DD-MM-YYYY"
                  value={formData.dateReceived ? dayjs(formData.dateReceived) : null}
                  onChange={handleDateChange}
                  disabledDate={(current) => isDateDisabledForAction(current, "import-order-create", configuration, undefined, importRequest || undefined)}
                  showNow={false}
                />
                <div className="text-sm text-red-400 mt-1">
                  <InfoCircleOutlined className="mr-1" />
                  LƯU Ý: Phiếu nhập <b>{importRequest?.importRequestId}</b> có hiệu lực từ <b>{dayjs(importRequest?.startDate).format('DD-MM-YYYY')}</b> đến <b>{dayjs(importRequest?.endDate).format('DD-MM-YYYY')}</b>
                </div>
              </div>
              <div>
                <label className="text-md font-semibold">Giờ nhận dự kiến <span className="text-red-500">*</span></label>
                <TimePicker
                  className="w-full"
                  value={formData.timeReceived ? dayjs(`1970-01-01 ${formData.timeReceived}`) : null}
                  onChange={handleTimeChange}
                  format="HH:mm"
                  showNow={false}
                  needConfirm={false}
                  disabledTime={() => getDisabledTimeConfigForAction(formData.dateReceived, "import-order-create", configuration, undefined, importRequest || undefined)}
                />
                <div className="text-sm text-blue-500">
                  <InfoCircleOutlined className="mr-1" />
                  Giờ nhận phải cách thời điểm hiện tại ít nhất <span className="font-bold">{parseInt(configuration?.createRequestTimeAtLeast.split(':')[0]!, 10)} giờ</span>
                </div>
              </div>
              <div className="my-2">
                <label className="text-md font-semibold">Nhà cung cấp (theo PHIẾU NHẬP)</label>
                <Typography.Text className="block w-full px-3 py-2 bg-gray-100 rounded" style={{ display: 'block' }}>
                  {importRequest?.providerId
                    ? providers.find(p => p.id === importRequest.providerId)?.name || `#${importRequest.providerId}`
                    : "Chưa chọn"}
                </Typography.Text>
              </div>
              <div>
                <label className="text-md font-semibold">Ghi chú</label>
                <TextArea
                  placeholder="Nhập ghi chú"
                  rows={4}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value.slice(0, 150) })}
                  className="w-full"
                  maxLength={150}
                  showCount
                />
              </div>
              <Button
                type="primary"
                onClick={() => {
                  // Kiểm tra thời gian hết hạn trước khi mở modal
                  if (configuration && importRequest?.endDate) {
                    const currentDateTime = dayjs();
                    const importRequestEndDate = dayjs(importRequest.endDate).endOf('day');
                    
                    // Kiểm tra nếu ngày hiện tại là ngày kết thúc
                    if (currentDateTime.isSame(importRequestEndDate, 'day')) {
                      try {
                        const minDateTime = getDefaultAssignedDateTimeForAction(
                          'import-order-create',
                          configuration,
                          undefined,
                          importRequest
                        );
                        
                        // Nếu thời gian tối thiểu vượt quá ngày kết thúc, đã hết hạn
                        if (dayjs(`${minDateTime.date} ${minDateTime.time}`).isAfter(importRequestEndDate)) {
                          toast.error("Đã hết hạn tạo đơn nhập cho phiếu này!");
                          // Chuyển về trang chi tiết phiếu nhập
                          navigate(ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(importRequest.importRequestId));
                          return;
                        }
                      } catch (error) {
                        console.error("Error checking import order creation time:", error);
                        toast.error("Có lỗi xảy ra khi kiểm tra thời gian tạo đơn nhập!");
                        return;
                      }
                    }
                  }
                  setShowConfirmModal(true);
                }}
                loading={loading}
                className="w-full mt-8"
                id="btn-detail"
              // disabled={formData.providerId !== importRequest?.providerId}
              >
                Xác nhận thông tin
              </Button>
            </Space>
          </Card>
          <div className="w-7/10">
            <Card title="Danh sách hàng hóa cần nhập">
              {editableRows.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={editableRows}
                  rowKey="itemId"
                  loading={loading}
                  pagination={pagination}
                  onChange={handleTableChange}
                  className="custom-table"
                />
              ) : (
                <div className="text-center py-10 text-gray-500">
                  "Không có dữ liệu"
                </div>
              )}
            </Card>
          </div>
        </div>

      )}
      <ImportOrderConfirmModal
        open={showConfirmModal}
        onOk={handleSubmit}
        onCancel={() => setShowConfirmModal(false)}
        confirmLoading={loading}
        formData={formData}
        details={editableRows}
        importRequestProvider={providers.find(p => p.id === importRequest?.providerId)?.name}
      />
    </div>
  );
};

export default ImportOrderCreate;
