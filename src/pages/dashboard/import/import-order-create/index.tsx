import React, { useState, useEffect, useRef } from "react";
import useProviderService, { ProviderResponse } from "@/services/useProviderService";
import { Button, Input, Typography, Space, Card, DatePicker, TimePicker, TablePaginationConfig, Table, ConfigProvider, Steps } from "antd";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import useImportOrderService, { ImportOrderCreateRequest } from "@/services/useImportOrderService";
import useImportRequestService, { ImportRequestResponse } from "@/services/useImportRequestService";
import useImportOrderDetailService from "@/services/useImportOrderDetailService";
import { ImportRequestDetailResponse } from "@/services/useImportRequestDetailService";
import useConfigurationService, { ConfigurationDto } from "@/services/useConfigurationService";
import useItemService, { ItemResponse } from "@/services/useItemService";
import { toast } from "react-toastify";
import dayjs, { Dayjs } from "dayjs";
import { ArrowLeftOutlined, ArrowRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { ROUTES } from "@/constants/routes";
import ExcelUploadSection from "@/components/commons/ExcelUploadSection";
import EditableImportOrderTableSection, { ImportOrderDetailRow } from "@/components/import-flow/import-order/EditableImportOrderTableSection";
import ImportOrderConfirmModal from "@/components/import-flow/import-order/ImportOrderConfirmModal";
import {
  getDefaultAssignedDateTimeForAction,
  isDateDisabledForAction,
  getDisabledTimeConfigForAction
} from "@/utils/helpers";

const { TextArea } = Input;

// ==================== UTILITY FUNCTIONS ====================
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
  // ==================== ROUTER & PARAMS ====================
  const { importRequestId: paramImportRequestId } = useParams<{ importRequestId: string }>();
  const { importRequestDetails } = useLocation().state as { importRequestDetails: ImportRequestDetailResponse[] } || {};
  const navigate = useNavigate();

  // ==================== SERVICES ====================
  const { getAllProviders } = useProviderService();
  const { getConfiguration } = useConfigurationService();
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
  const {
    loading: itemLoading,
    getItems
  } = useItemService();

  // ==================== DATA STATES ====================
  const [providers, setProviders] = useState<ProviderResponse[]>([]);
  const [configuration, setConfiguration] = useState<ConfigurationDto | null>(null);
  const [importRequest, setImportRequest] = useState<ImportRequestResponse | null>(null);
  const [itemsData, setItemsData] = useState<ItemResponse[]>([]);
  const [editableRows, setEditableRows] = useState<ImportOrderDetailRow[]>([]);

  // ==================== UI & FORM STATES ====================
  const [step, setStep] = useState<number>(0); // 0 = upload/edit, 1 = confirm
  const [showImportOrderConfirmModal, setShowImportOrderConfirmModal] = useState(false);
  const [excelImported, setExcelImported] = useState<boolean>(false);
  const [isAllPagesViewed, setIsAllPagesViewed] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [defaultDateTime, setDefaultDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: ""
  });

  const [formData, setFormData] = useState<ImportOrderCreateRequest>({
    importRequestId: null,
    accountId: null,
    dateReceived: "",
    timeReceived: "",
    note: ""
  });

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 5,
    total: importRequestDetails.length,
  });

  // ==================== COMPUTED VALUES ====================
  const loading = importOrderLoading || importRequestLoading || importOrderDetailLoading || itemLoading;

  // Validation flag for import order data
  const isImportOrderDataValid = editableRows.length > 0 && editableRows.every(row => {
    if (importRequest?.importType === "RETURN") {
      const currentValue = row.plannedMeasurementValue || 0;
      if (row.actualMeasurementValue === 0) {
        return currentValue > 0 && currentValue <= (row.expectMeasurementValue - row.orderedMeasurementValue);
      }
      return currentValue > 0 && currentValue <= (row.expectMeasurementValue - row.actualMeasurementValue);
    } else {
      if (row.actualQuantity === 0) {
        return row.plannedQuantity > 0 && row.plannedQuantity <= (row.expectQuantity - row.orderedQuantity);
      }
      return row.plannedQuantity > 0 && row.plannedQuantity <= (row.expectQuantity - row.actualQuantity);
    }
  });

  // ==================== UTILITY FUNCTIONS ====================
  const getDefaultDateTimeForComponent = () => {
    return getDefaultAssignedDateTimeForAction("import-order-create", configuration!, undefined, importRequest || undefined);
  };

  const getItemInfo = (itemId: string) => {
    return itemsData.find(item => String(item.id) === String(itemId));
  };
  const disabledDate = (current: Dayjs) =>
    isDateDisabledForAction(current, "import-order-create", configuration, undefined, importRequest || undefined);

  const disabledTime = () =>
    getDisabledTimeConfigForAction(formData.dateReceived, "import-order-create", configuration, undefined, importRequest || undefined);

  const checkImportOrderExpiry = (): boolean => {
    if (configuration && importRequest?.endDate) {
      const currentDateTime = dayjs();
      const importRequestEndDate = dayjs(importRequest.endDate).endOf('day');

      // Kiểm tra nếu ngày hiện tại là ngày kết thúc
      if (currentDateTime.isSame(importRequestEndDate, 'day')) {
        const minDateTime = getDefaultAssignedDateTimeForAction(
          'import-order-create',
          configuration,
          undefined,
          importRequest
        );

        // Nếu thời gian tối thiểu vượt quá ngày kết thúc, đã hết hạn
        if (dayjs(`${minDateTime.date} ${minDateTime.time}`).isAfter(importRequestEndDate)) {
          toast.error("Đã hết hạn tạo đơn nhập cho phiếu này!");
          return false;
        }
      }
    }
    return true;
  };

  // ========== DATA FETCHING FUNCTIONS ==========
  // Fetch providers data
  const fetchProviders = async () => {
    const response = await getAllProviders(1, 1000);;
    if (response && response.content) {
      setProviders(response.content);
    }

  };

  // Fetch configuration data
  const fetchConfiguration = async () => {
    const config = await getConfiguration();
    if (config) {
      setConfiguration(config);
    }
  };

  // Fetch import request data
  const fetchImportRequest = async () => {
    const response = await getImportRequestById(paramImportRequestId!);
    if (response?.content) {
      setImportRequest(response.content);
      setFormData(prev => ({
        ...prev,
        importRequestId: paramImportRequestId!,
        providerId: response.content.providerId
      }))
    }
  };

  // Fetch items data
  const fetchItems = async () => {
    const response = await getItems();
    if (response?.content) {
      setItemsData(response.content);
    }
  };

  // ==================== USE EFFECTS ====================
  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    fetchConfiguration();
  }, []);

  useEffect(() => {
    fetchImportRequest();
    fetchItems();
  }, [paramImportRequestId]);

  // Set default date time when configuration is loaded
  useEffect(() => {
    if (configuration) {
      setDefaultDateTime(getDefaultDateTimeForComponent());
    }
  }, [configuration, importRequest]);

  // Update form data when default date time changes
  useEffect(() => {
    if (defaultDateTime.date && defaultDateTime.time) {
      setFormData(prev => ({
        ...prev,
        dateReceived: defaultDateTime.date,
        timeReceived: defaultDateTime.time
      }));
    }
  }, [defaultDateTime]);

  // Initialize editable rows when import request details are loaded
  useEffect(() => {
    if (importRequestDetails.length && !excelImported && itemsData.length > 0) {
      setEditableRows(
        importRequestDetails
          .filter(row => {
            if (importRequest?.importType === "RETURN") {
              if (row.actualMeasurementValue === 0) {
                return row.expectMeasurementValue !== row.orderedMeasurementValue;
              } else {
                return row.expectMeasurementValue !== row.actualMeasurementValue;
              }
            } else {
              if (row.actualQuantity === 0) {
                return row.expectQuantity !== row.orderedQuantity;
              } else {
                return row.expectQuantity !== row.actualQuantity;
              }
            }
          })
          .map(row => {
            const itemInfo = getItemInfo(row.itemId);
            return {
              itemId: row.itemId,
              itemName: row.itemName,
              expectQuantity: row.expectQuantity,
              orderedQuantity: row.orderedQuantity,
              plannedQuantity: row.actualQuantity === 0
                ? row.expectQuantity - row.orderedQuantity
                : row.expectQuantity - row.actualQuantity,
              actualQuantity: row.actualQuantity,
              expectMeasurementValue: row.expectMeasurementValue || 0,
              orderedMeasurementValue: row.orderedMeasurementValue || 0,
              actualMeasurementValue: row.actualMeasurementValue || 0,
              plannedMeasurementValue: importRequest?.importType === "RETURN"
                ? (row.actualMeasurementValue === 0
                  ? row.expectMeasurementValue - row.orderedMeasurementValue
                  : row.expectMeasurementValue - row.actualMeasurementValue)
                : 0,
              importRequestProviderId: importRequest?.providerId || 0,
              measurementUnit: itemInfo?.measurementUnit,
            };
          })
      );
    }
  }, [importRequestDetails, importRequest, excelImported, itemsData]);

  // ==================== EVENT HANDLERS ====================
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

  const handleConfirmClick = () => {
    if (!checkImportOrderExpiry()) return;
    setShowImportOrderConfirmModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.importRequestId) {
      toast.error("Vui lòng chọn phiếu nhập");
      return;
    }

    // Kiểm tra lại thời gian hết hạn trước khi tạo đơn nhập
    if (!checkImportOrderExpiry()) {
      navigate(ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(importRequest?.importRequestId!));
      return;
    }

    // 1. Tạo đơn nhập
    const createOrderRequest: ImportOrderCreateRequest = {
      importRequestId: formData.importRequestId,
      accountId: formData.accountId,
      dateReceived: formData.dateReceived,
      timeReceived: formData.timeReceived,
      note: formData.note,
      exportRequestId: importRequest?.exportRequestId || undefined
    };
    const response = await createImportOrder(createOrderRequest);
    if (response?.content) {
      // 2. Chỉ gửi các itemId có trong phiếu nhập
      const validItemIds = importRequestDetails.map(importRequestDetail => importRequestDetail.itemId);
      const importOrderItems = editableRows.filter(row => validItemIds.includes(row.itemId)).map(row => ({
        itemId: row.itemId,
        quantity: importRequest?.importType === "RETURN" ? (row.plannedMeasurementValue || 0) : row.plannedQuantity
      }));
      await createImportOrderDetails(
        { providerId: importRequest?.providerId!, importOrderItems },
        response.content.importOrderId
      );
      // 3. Chuyển hướng về danh sách đơn nhập từ phiếu nhập
      navigate(ROUTES.PROTECTED.IMPORT.ORDER.LIST);
    }

    if (response.statusCode == 444) {
      toast.error("Phiếu nhập đã hết hạn");
      navigate(ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(importRequest?.importRequestId!));
      return;
    }
  };

  const handleNextStep = () => {
    setStep(1);
  };


  // ==================== EXCEL FUNCTIONS ====================
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
          const dateReceived = getCell('B6');
          const timeReceived = getCell('B7');
          const note = getCell('B8');

          // Validate header fields first
          if (!dateReceived || !timeReceived) {
            toast.error("File Excel phải có đủ thông tin ngày nhận và giờ nhận ở B6, B7");
            return;
          }

          // Get the range of the sheet
          if (!ws['!ref']) {
            toast.error("Không tìm thấy dữ liệu bảng trong file Excel (thiếu !ref).");
            return;
          }

          const range = XLSX.utils.decode_range(ws['!ref']);

          // Find headers in row 5
          const headers = [getCell('A10'), getCell('B10'), getCell('C10'), getCell('D10')];
          if (headers[0] !== 'Số thứ tự' || headers[1] !== 'Mã sản phẩm' ||
            headers[2] !== 'Số lượng cần nhập' || headers[3] !== 'Mã nhà cung cấp') {
            toast.error("File Excel phải có header hàng hóa ở dòng 10: Số thứ tự, Mã sản phẩm, Số lượng cần nhập, Mã nhà cung cấp");
            return;
          }

          // Parse data from row 11 onwards
          const excelDetails: { itemId: string, quantity: number }[] = [];
          for (let row = 11; row <= range.e.r + 1; row++) {
            const stt = getCell(`A${row}`);
            const itemId = getCell(`B${row}`);
            const quantity = getCell(`C${row}`);
            const providerId = getCell(`D${row}`);

            // Skip empty rows
            if (!itemId || !quantity) continue;

            if (itemId && quantity && !isNaN(Number(quantity)) && Number(quantity) >= 0) {
              excelDetails.push({
                itemId: String(itemId).trim(),
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

          setFileName(uploadedFile.name);

          setFormData(prev => ({
            ...prev,
            dateReceived: typeof dateReceived === 'number' ? excelDateToYMD(dateReceived) : dateReceived,
            timeReceived: typeof timeReceived === 'number' ? excelTimeToHM(timeReceived) : timeReceived,
            note: note ? note.toString() : prev.note
          }));

          // Update plannedQuantity for matching itemIds, keep others unchanged
          const updatedRows = editableRows.map(row => {
            const match = excelDetails.find(d => String(d.itemId) === String(row.itemId));
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

  const handleRemoveFile = () => {
    setFileName("");
    setExcelImported(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Reset form data to default values
    setFormData(prev => ({
      ...prev,
      dateReceived: defaultDateTime.date,
      timeReceived: defaultDateTime.time,
      note: ""
    }));
    // Reset editable rows to original data
    if (importRequestDetails.length && itemsData.length > 0) {
      setEditableRows(
        importRequestDetails
          .filter(row => {
            if (importRequest?.importType === "RETURN") {
              if (row.actualMeasurementValue === 0) {
                return row.expectMeasurementValue !== row.orderedMeasurementValue;
              } else {
                return row.expectMeasurementValue !== row.actualMeasurementValue;
              }
            } else {
              if (row.actualQuantity === 0) {
                return row.expectQuantity !== row.orderedQuantity;
              } else {
                return row.expectQuantity !== row.actualQuantity;
              }
            }
          })
          .map(row => {
            const itemInfo = getItemInfo(row.itemId);
            return {
              itemId: row.itemId,
              itemName: row.itemName,
              expectQuantity: row.expectQuantity,
              orderedQuantity: row.orderedQuantity,
              plannedQuantity: row.actualQuantity === 0
                ? row.expectQuantity - row.orderedQuantity
                : row.expectQuantity - row.actualQuantity,
              actualQuantity: row.actualQuantity,
              expectMeasurementValue: row.expectMeasurementValue || 0,
              orderedMeasurementValue: row.orderedMeasurementValue || 0,
              actualMeasurementValue: row.actualMeasurementValue || 0,
              plannedMeasurementValue: importRequest?.importType === "RETURN"
                ? (row.actualMeasurementValue === 0
                  ? row.expectMeasurementValue - row.orderedMeasurementValue
                  : row.expectMeasurementValue - row.actualMeasurementValue)
                : 0,
              importRequestProviderId: importRequest?.providerId || 0,
              measurementUnit: itemInfo?.measurementUnit,
            };
          })
      );
    }
  };

  // ==================== TABLE CONFIGURATION ====================
  const getConfirmationColumns = () => {
    const baseColumns: any[] = [
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
    ];

    if (importRequest?.importType === "RETURN") {
      baseColumns.push(
        {
          title: "Dự nhập theo phiếu",
          dataIndex: "expectMeasurementValue",
          key: "expectMeasurementValue",
          align: "right" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (value: number, record: ImportOrderDetailRow) => {
            return (
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>{value || 0}</span>{" "}
                {record?.measurementUnit && (
                  <span>{record.measurementUnit}</span>
                )}
              </div>
            );
          },
        },
        {
          title: "Thực tế đã nhập",
          dataIndex: "actualMeasurementValue",
          key: "actualMeasurementValue",
          align: "right" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (value: number, record: ImportOrderDetailRow) => {
            return (
              <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: "600", fontSize: "16px" }}>{value || 0}</span>{" "}
                {record?.measurementUnit && (
                  <span>{record.measurementUnit}</span>
                )}
              </div>
            );
          },
        },
        {
          title: "Dự nhập đơn này",
          dataIndex: "plannedMeasurementValue",
          key: "plannedMeasurementValue",
          align: "right" as const,
          onHeaderCell: () => ({
            style: { textAlign: 'center' as const }
          }),
          render: (_: any, record: ImportOrderDetailRow) => {
            return (
              <span className="inline-block px-3 py-1 font-medium text-blue-600 rounded-md bg-blue-50" style={{ textAlign: 'right' }}>
                {record.plannedMeasurementValue || 0}{" "}
                {record?.measurementUnit && (
                  <span>{record.measurementUnit}</span>
                )}
              </span>
            );
          },
        }
      );
    } else {
      baseColumns.push(
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
            <span className="inline-block px-3 py-1 font-medium text-blue-600 rounded-md bg-blue-50" style={{ textAlign: 'right' }}>
              {record.plannedQuantity}
            </span>
          ),
        }
      );
    }

    return baseColumns;
  };


  // ==================== RENDER ====================
  return (
    <div className="container p-3 pt-0 mx-auto">
      <div className="flex items-center mb-2">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => step === 1 ? setStep(0) : navigate(ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(importRequest?.importRequestId))}
          className="mr-4"
        >
          Quay lại
        </Button>
      </div>
      <div className="w-2/3 mx-auto">
        <Steps
          className="!mb-4"
          current={step}
          onChange={setStep}
          items={[
            {
              title: <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Nhập thông tin</span>,
            },
            {
              title: <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Xác nhận thông tin</span>,
              disabled: editableRows.length === 0 || !isImportOrderDataValid || !isAllPagesViewed
            }
          ]}
        />
      </div>

      {/* Step 1: Upload Excel + Editable Table */}
      {step === 0 && (
        <div className="flex flex-col items-center gap-2">
          {importRequest?.importType !== "RETURN" && (
            <div className="w-full">
              <ExcelUploadSection
                fileName={fileName}
                onFileChange={handleExcelUpload}
                onRemoveFile={handleRemoveFile}
                fileInputRef={fileInputRef}
                buttonLabel="Tải lên file Excel"
                type="IMPORT_ORDER"
              />
            </div>
          )}
          <div className="w-full">
            <EditableImportOrderTableSection
              loading={itemLoading || importOrderDetailLoading}
              data={editableRows}
              onChange={setEditableRows}
              title="Danh sách hàng hóa cần nhập"
              emptyText="Chưa có dữ liệu từ file Excel"
              excelImported={excelImported}
              setIsAllPagesViewed={setIsAllPagesViewed}
              importType={importRequest?.importType}
            />
          </div>
          <Button
            type="primary"
            className="mt-2"
            disabled={!isImportOrderDataValid || !isAllPagesViewed}
            onClick={handleNextStep}
          >
            Tiếp tục nhập thông tin đơn nhập
            {!isAllPagesViewed && isImportOrderDataValid && <span style={{ color: 'red', marginLeft: 4 }}>(Vui lòng xem tất cả các trang)</span>}
            <ArrowRightOutlined />
          </Button>
        </div>
      )}

      {/* Step 2: Show current form */}
      {step === 1 && (
        <div className="flex gap-6 mt-4">
          <Card
            title={<span className="text-xl font-semibold">Thông tin đơn nhập</span>}
            className="w-3/10"
          >
            <Space direction="vertical" className="w-full">
              <div className="mb-2">
                <div className="mb-1 text-sm text-blue-500">
                  <div>
                    <InfoCircleOutlined className="mr-1" />
                    Phiếu nhập <b>{importRequest?.importRequestId}</b>
                  </div> Có hiệu lực từ <b>{dayjs(importRequest?.startDate).format('DD-MM-YYYY')}</b> đến <b>{dayjs(importRequest?.endDate).format('DD-MM-YYYY')}</b>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-base font-semibold">Ngày nhận dự kiến<span className="text-red-500">*</span></label>
                  <DatePicker
                    className="w-1/2 !ml-auto !p-[4px_8px]"
                    size="large"
                    format="DD-MM-YYYY"
                    value={formData.dateReceived ? dayjs(formData.dateReceived) : null}
                    onChange={handleDateChange}
                    disabledDate={disabledDate}
                    showNow={false}
                    allowClear
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm text-blue-500">
                  <InfoCircleOutlined className="mr-1" />
                  Giờ nhận phải cách thời điểm hiện tại ít nhất <span className="font-bold">{parseInt(configuration?.createRequestTimeAtLeast.split(':')[0]!, 10)} giờ</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-base font-semibold">Giờ nhận dự kiến<span className="text-red-500">*</span></label>
                  <ConfigProvider direction="rtl">
                    <TimePicker
                      className="w-1/2 !ml-auto !p-[4px_8px]"
                      size="large"
                      value={formData.timeReceived ? dayjs(`1970-01-01 ${formData.timeReceived}`) : null}
                      onChange={handleTimeChange}
                      format="HH:mm"
                      showNow={false}
                      needConfirm={false}
                      disabledTime={disabledTime}
                      allowClear
                    />
                  </ConfigProvider>
                </div>
              </div>
              {importRequest?.importType !== "RETURN" && (
                <div className="my-2">
                  <label className="text-base font-semibold">Nhà cung cấp (theo PHIẾU NHẬP)</label>
                  <Typography.Text className="block w-full px-3 py-2 bg-gray-100 rounded" style={{ display: 'block' }}>
                    {importRequest?.providerId
                      ? providers.find(p => p.id === importRequest.providerId)?.name || `#${importRequest.providerId}`
                      : "Chưa chọn"}
                  </Typography.Text>
                </div>
              )}
              <div>
                <label className="text-base font-semibold">Ghi chú</label>
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
                onClick={handleConfirmClick}
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
            <Card title={<span className="text-xl font-semibold">Danh sách hàng hóa cần nhập</span>}>
              {editableRows.length > 0 ? (
                <Table
                  columns={getConfirmationColumns()}
                  dataSource={editableRows}
                  rowKey="itemId"
                  loading={loading}
                  pagination={pagination}
                  onChange={handleTableChange}
                  className="custom-table"
                />
              ) : (
                <div className="py-10 text-center text-gray-500">
                  Không có dữ liệu
                </div>
              )}
            </Card>
          </div>
        </div>

      )}

      {/* Confirm Modal */}
      <ImportOrderConfirmModal
        open={showImportOrderConfirmModal}
        onOk={handleSubmit}
        onCancel={() => setShowImportOrderConfirmModal(false)}
        confirmLoading={loading}
        formData={formData}
        details={editableRows}
        importRequestProvider={providers.find(p => p.id === importRequest?.providerId)?.name}
        importType={importRequest?.importType}
        itemsData={itemsData}
      />
    </div>
  );
};

export default ImportOrderCreate;
