import React, { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import * as XLSX from "xlsx";
import { Button, Input, Typography, Space, Card, Alert, Table, DatePicker, ConfigProvider, Steps, Modal, Checkbox } from "antd";
import useProviderService, { ProviderResponse } from "@/services/useProviderService";
import useItemService, { ItemResponse } from "@/services/useItemService";
import useImportRequestDetailService, { ImportRequestCreateWithDetailRequest } from "@/services/useImportRequestDetailService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import ExcelUploadSection from "@/components/commons/ExcelUploadSection";
import { ArrowRightOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { FormData, ImportRequestDetailRow } from "@/utils/interfaces";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";
import { calculateRowSpanForItemHaveSameCompareValue, isDateDisabledForAction } from "@/utils/helpers";
import useConfigurationService, { ConfigurationDto } from "@/services/useConfigurationService";
import { ImportRequestType } from "@/components/commons/RequestTypeSelector";
import { useScrollViewTracker } from "@/hooks/useScrollViewTracker";
import EditableImportRequestOrderTable from "./EditableImportRequestOrderTable";
import ImportRequestOrderConfirmModal from "./ImportRequestOrderConfirmModal";

const { TextArea } = Input;

interface ImportRequestOrderTypeProps {
  onStepChange?: (step: number) => void;
}

const ImportRequestOrderTypeCreating: React.FC<ImportRequestOrderTypeProps> = ({
  onStepChange
}) => {
  const importType: ImportRequestType = "ORDER";
  // ========== ROUTER & PARAMS ==========
  const navigate = useNavigate();

  // ========== DATA STATES ==========
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [importedData, setImportedData] = useState<ImportRequestDetailRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [configuration, setConfiguration] = useState<ConfigurationDto | null>(null);
  const [formData, setFormData] = useState<FormData>({
    importReason: "",
    importType,
    exportRequestId: null,
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: dayjs().add(1, 'day').format("YYYY-MM-DD"),
  });
  const [providers, setProviders] = useState<ProviderResponse[]>([]);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [isImportRequestDataValid, setIsImportRequestDataValid] = useState<boolean>(false);
  const [isAllPagesViewed, setIsAllPagesViewed] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== ZERO QUANTITY DELETE STATES ==========
  const [quantityZeroRowsToDelete, setQuantityZeroRowsToDelete] = useState<ImportRequestDetailRow[]>([]);
  const [deleteQuantityZeroRowsResponsibilityChecked, setDeleteQuantityZeroRowsResponsibilityChecked] = useState<boolean>(false);
  const [isDeleteQuantityZeroRowModalOpen, setIsDeleteQuantityZeroRowModalOpen] = useState(false);

  // ========== SCROLL VIEW TRACKER FOR DELETE MODAL ==========
  const { scrollContainerRef: deleteModalScrollRef, checkScrollPosition: checkDeleteModalScroll, hasScrolledToBottom: hasScrolledToBottomInDeleteModal, resetScrollTracking: resetDeleteModalScroll } = useScrollViewTracker(5);

  // ========== UI & FORM STATES ==========
  const [step, setStep] = useState<number>(0);

  // Notify parent component when step changes
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  // ========== PAGINATION STATE ==========
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // ========== SERVICES ==========
  const {
    loading: importRequestDetailLoading,
    createImportRequestDetail
  } = useImportRequestDetailService();

  const {
    loading: providerLoading,
    getAllProviders
  } = useProviderService();

  const {
    loading: itemLoading,
    getItems
  } = useItemService();

  const {
    getConfiguration
  } = useConfigurationService();

  // ========== COMPUTED VALUES ==========
  const loading = providerLoading || itemLoading || importRequestDetailLoading;

  // ========== UTILITY FUNCTIONS ==========
  const isEndDateValid = (startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return true;

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (end.isBefore(start)) {
      return false;
    }

    if (configuration) {
      const maxDays = configuration.maxAllowedDaysForImportRequestProcess;
      const daysDiff = end.diff(start, 'day');

      if (daysDiff > maxDays) {
        return false;
      }
    }

    return true;
  };

  const isFormDataValid = (): boolean => {
    if (!formData.importReason || !formData.startDate || !formData.endDate) {
      return false;
    }

    const startDate = dayjs(formData.startDate);
    const today = dayjs().startOf('day');
    if (startDate.isBefore(today)) {
      return false;
    }

    if (!isEndDateValid(formData.startDate, formData.endDate)) {
      return false;
    }

    return true;
  };

  const getConsolidatedData = (originalData: ImportRequestDetailRow[]): ImportRequestDetailRow[] => {
    const groupedData: { [key: string]: ImportRequestDetailRow } = {};

    originalData.forEach((item) => {
      const key = `${item.itemId}-${item.providerId}`;

      if (groupedData[key]) {
        groupedData[key].quantity += item.quantity;
      } else {
        groupedData[key] = { ...item };
      }
    });

    return Object.values(groupedData);
  };

  // ========== COMPUTED VALUES & FILTERING ==========
  const sortedData = useMemo(() => {
    if (step === 1) {
      return [...getConsolidatedData(importedData)].sort((a, b) => a.providerId - b.providerId);
    }
    return [...importedData].sort((a, b) => a.providerId - b.providerId);
  }, [importedData, step]);

  // ========== USE EFFECTS ==========
  useEffect(() => {
    const fetchData = async () => {
      const [providersResponse, itemsResponse] = await Promise.all([
        getAllProviders(),
        getItems()
      ]);

      if (providersResponse?.content && itemsResponse?.content) {
        setProviders(providersResponse.content);
        setItems(itemsResponse.content);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchConfiguration = async () => {
      const configuration = await getConfiguration();
      setConfiguration(configuration);
    };
    fetchConfiguration();
  }, []);

  useEffect(() => {
    if (configuration?.maxAllowedDaysForImportRequestProcess) {
      setFormData(prev => ({
        ...prev,
        endDate: dayjs(prev.startDate).add(configuration.maxAllowedDaysForImportRequestProcess, 'day').format("YYYY-MM-DD")
      }));
    }
  }, [configuration]);

  useEffect(() => {
    if (!isDeleteQuantityZeroRowModalOpen) {
      resetDeleteModalScroll();
      setDeleteQuantityZeroRowsResponsibilityChecked(false);
    }
  }, [isDeleteQuantityZeroRowModalOpen, resetDeleteModalScroll]);

  // Update formData when importType prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      importType: importType
    }));
  }, [importType]);


  // ========== EVENT HANDLERS ==========
  const handleChangePage = (paginationObj: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationObj.current,
      pageSize: paginationObj.pageSize || prev.pageSize,
    }));
  };

  const handleStartDateChange = (date: dayjs.Dayjs | null) => {
    const newStartDate = date ? date.format("YYYY-MM-DD") : "";

    let newEndDate = formData.endDate;
    if (newStartDate && configuration?.maxAllowedDaysForImportRequestProcess) {
      newEndDate = dayjs(newStartDate).add(configuration.maxAllowedDaysForImportRequestProcess, 'day').format("YYYY-MM-DD");
    }

    if (newStartDate && newEndDate) {
      if (!isEndDateValid(newStartDate, newEndDate)) {
        setFormData({ ...formData, startDate: newStartDate, endDate: "" });
        return;
      }
    }

    setFormData({ ...formData, startDate: newStartDate, endDate: newEndDate });
  };

  const handleEndDateChange = (date: dayjs.Dayjs | null) => {
    const newEndDate = date ? date.format("YYYY-MM-DD") : "";
    setFormData({ ...formData, endDate: newEndDate });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const ab = event.target?.result;
        if (ab instanceof ArrayBuffer) {
          const wb = XLSX.read(ab, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];

          try {
            // Extract import type from B6 (row index 5)
            const importTypeCell = ws['B6'];
            const importTypeFromFile = importTypeCell ? importTypeCell.v : null;

            // Extract import reason from B7 (row index 6)  
            const importReasonCell = ws['B7'];
            const importReason = importReasonCell ? importReasonCell.v : "";

            // Map Vietnamese import types to system codes
            const importTypeMapping = {
              "NHẬP THEO KẾ HOẠCH": "ORDER",
              "ORDER": "ORDER",
            };

            if (importTypeFromFile) {
              const normalizedType = String(importTypeFromFile).trim().toUpperCase();
              const mappedType = importTypeMapping[normalizedType];

              if (mappedType) {
                setFormData(prev => ({
                  ...prev,
                  importType: mappedType as ImportRequestType,
                  importReason: importReason || prev.importReason
                }));
              } else {
                console.warn(`Unrecognized import type: "${importTypeFromFile}"`);
              }
            }

            // Parse data rows starting from row 10 (index 9)
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            const jsonData = [];

            for (let rowNum = 9; rowNum <= range.e.r; rowNum++) {
              const row: any = {};
              const sttCell = ws[XLSX.utils.encode_cell({ r: rowNum, c: 0 })]; // Column A - STT
              const itemIdCell = ws[XLSX.utils.encode_cell({ r: rowNum, c: 1 })]; // Column B - Mã sản phẩm  
              const quantityCell = ws[XLSX.utils.encode_cell({ r: rowNum, c: 2 })]; // Column C - Số lượng cần nhập
              const providerIdCell = ws[XLSX.utils.encode_cell({ r: rowNum, c: 3 })]; // Column D - Mã nhà cung cấp

              // Skip header row and empty rows
              if (sttCell && String(sttCell.v).trim() === "Số thứ tự") continue;
              if (!itemIdCell || !quantityCell) continue;

              const itemId = String(itemIdCell.v).trim();
              const quantity = String(quantityCell.v).trim();
              const providerId = String(providerIdCell.v).trim();

              if (itemId && quantity && providerId &&
                !isNaN(Number(quantity)) &&
                Number(quantity) >= 0) {
                row.itemId = itemId;
                row.quantity = Number(quantity);
                row.providerId = Number(providerId);
                jsonData.push(row);
              }
            }

            const transformedData: ImportRequestDetailRow[] = jsonData.map((item: any, index: number) => {
              const itemId = item.itemId;
              const quantity = item.quantity;
              const providerId = item.providerId;

              if (!itemId || !quantity || !providerId) {
                throw new Error(`Row ${index + 10}: Missing item ID or quantity`);
              }

              const foundItem = items.find(i => i.id === itemId);
              if (!foundItem) {
                throw new Error(`Row ${index + 10}: Item with ID ${itemId} not found`);
              }

              const foundProvider = providers.find(p => p.id === Number(providerId));
              if (!foundProvider) {
                throw new Error(`Row ${index + 10}: Provider with ID ${providerId} not found`);
              }

              // Validate that the provider is actually a provider for this item
              if (!Array.isArray(foundItem.providerIds) || !foundItem.providerIds.includes(Number(providerId))) {
                throw new Error(`Row ${index + 10}: Provider ID ${providerId} is not a valid provider for item ${itemId}`);
              }


              return {
                itemId: itemId,
                quantity: Number(quantity),
                providerId: Number(providerId),
                itemName: foundItem.name,
                measurementUnit: foundItem.measurementUnit || "Unknown",
                measurementValue: foundItem.measurementValue || 0,
                unitType: foundItem.unitType,
                providerName: foundProvider.name
              };
            });

            setImportedData(transformedData);
            setIsImportRequestDataValid(true);

          } catch (error) {
            if (error instanceof Error) {
              setIsImportRequestDataValid(false);
              toast.error(error.message);
            }
          }
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
    setImportedData([]);
    setIsImportRequestDataValid(false);
    setIsAllPagesViewed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!file || importedData.length === 0) {
      toast.error("Vui lòng tải lên file Excel với dữ liệu hợp lệ");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc");
      return;
    }

    const details: ImportRequestCreateWithDetailRequest[] = (sortedData).map(row => ({
      itemId: row.itemId,
      quantity: row.quantity,
      providerId: row.providerId,
      importReason: formData.importReason,
      importType: formData.importType,
      exportRequestId: formData.exportRequestId,
      startDate: formData.startDate,
      endDate: formData.endDate
    }));

    await createImportRequestDetail(details);

    navigate(ROUTES.PROTECTED.IMPORT.REQUEST.LIST);
    setFormData({
      importReason: "",
      importType: importType,
      exportRequestId: null,
      startDate: dayjs().format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD"),
    });
    setFile(null);
    setFileName("");
    setImportedData([]);
  };

  // ========== ZERO QUANTITY HANDLERS ==========
  const handleNextStep = () => {
    const quantityZeroRows = importedData.filter(row => row.quantity === 0);
    if (quantityZeroRows.length > 0) {
      setQuantityZeroRowsToDelete(quantityZeroRows);
      setIsDeleteQuantityZeroRowModalOpen(true);
    } else {
      setStep(1);
    }
  };

  const confirmDeleteQuantityZeroRow = () => {
    const newImportedData = importedData.filter(row => !quantityZeroRowsToDelete.includes(row));
    setImportedData(newImportedData);
    setQuantityZeroRowsToDelete([]);
    setIsDeleteQuantityZeroRowModalOpen(false);
    setDeleteQuantityZeroRowsResponsibilityChecked(false);
    setStep(1);
  };

  const cancelDeleteQuantityZeroRow = () => {
    setIsDeleteQuantityZeroRowModalOpen(false);
    setDeleteQuantityZeroRowsResponsibilityChecked(false);
    setQuantityZeroRowsToDelete([]);
  };

  // ========== COMPUTED VALUES & RENDER LOGIC ==========
  const columns = [
    {
      width: "25%",
      title: <span className="font-semibold">Tên hàng</span>,
      dataIndex: "itemName",
      key: "itemName",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: "15%",
      title: <span className="font-semibold">Số lượng</span>,
      dataIndex: "quantity",
      key: "quantity",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: "12%",
      title: <span className="font-semibold">Đơn vị</span>,
      dataIndex: "unitType",
      key: "unitType",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: "18%",
      title: <span className="font-semibold">Quy cách</span>,
      dataIndex: "unitType",
      key: "unitType",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (_: any, record: ImportRequestDetailRow) => {
        return record.measurementValue + " " + record.measurementUnit + " / " + record.unitType
      }
    },
    {
      width: "30%",
      title: <span className="font-semibold">Nhà cung cấp</span>,
      dataIndex: "providerName",
      key: "providerName",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      onCell: (record: ImportRequestDetailRow, index?: number) => {
        const startIndex = (pagination.current - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const currentPageData = sortedData.slice(startIndex, endIndex);

        const rowSpan = calculateRowSpanForItemHaveSameCompareValue(currentPageData, "providerName", index || 0)
        return {
          rowSpan: rowSpan
        }
      }
    },
  ];

  return (
    <>
      <div className="w-2/3 mx-auto mt-2 mb-4">
        <Steps
          current={step}
          onChange={setStep}
          items={[
            {
              title: <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Tải lên file Excel</span>,
            },
            {
              title: <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Xác nhận thông tin</span>,
              disabled: importedData.length === 0 || !isImportRequestDataValid || !isAllPagesViewed
            }
          ]}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-600 font-medium">Đang tải dữ liệu nhà cung cấp và sản phẩm...</span>
          </div>
        </div>
      ) : (
        <>
          {step === 0 && (
            <div className="flex flex-col items-center gap-6 mt-2">
              <div className="w-full">
                <ExcelUploadSection
                  fileName={fileName}
                  onFileChange={handleFileUpload}
                  onRemoveFile={handleRemoveFile}
                  fileInputRef={fileInputRef}
                  buttonLabel="Tải lên file Excel"
                  type="IMPORT_REQUEST"
                />
                <EditableImportRequestOrderTable
                  setIsAllPagesViewed={setIsAllPagesViewed}
                  data={importedData}
                  setData={setImportedData}
                  items={items}
                  providers={providers}
                  alertNode={importedData.length > 0 ? (
                    <Alert
                      message="Thông tin nhập kho"
                      description={
                        <>
                          <p>Số lượng nhà cung cấp: {Array.from(new Set(importedData.map(item => item.providerId))).length}</p>
                          <p>Tổng số mặt hàng: {importedData.length}</p>
                          <p className="text-blue-500">Hệ thống sẽ tự động tạo phiếu nhập kho riêng theo từng nhà cung cấp</p>
                        </>
                      }
                      type="info"
                      showIcon
                      className="mb-4"
                    />
                  ) : null}
                  emptyText="Vui lòng tải lên file Excel để xem chi tiết hàng hóa"
                  title="Danh sách hàng hóa từ file Excel"
                />
              </div>
              <Button
                type="primary"
                onClick={handleNextStep}
                disabled={importedData.length === 0 || !isImportRequestDataValid || !isAllPagesViewed}
              >
                Tiếp tục nhập thông tin phiếu nhập
                <ArrowRightOutlined />
                {!isAllPagesViewed && isImportRequestDataValid && <span style={{ color: 'red', marginLeft: 4 }}>(Vui lòng xem tất cả các trang)</span>}
              </Button>
            </div>
          )}
          {step === 1 && (
            <div className="flex gap-6 mt-4">
              <Card title={<span className="text-xl font-semibold">Thông tin phiếu nhập</span>} className="w-3/10">
                <Space direction="vertical" className="w-full">
                  <div className="text-sm text-blue-500">
                    <InfoCircleOutlined className="mr-1" />
                    Ngày hết hạn không được quá <span className="font-bold">{configuration?.maxAllowedDaysForImportRequestProcess} ngày</span> kể từ ngày bắt đầu
                  </div>
                  <div className="flex gap-6 mb-4">
                    <div className="w-1/2 mb-2">
                      <label className="text-base font-semibold">Ngày có hiệu lực<span className="text-red-500">*</span></label>
                      <DatePicker
                        locale={locale}
                        format="DD-MM-YYYY"
                        size="large"
                        className="w-full !mt-1 !p-[4px_8px]"
                        value={formData.startDate ? dayjs(formData.startDate) : null}
                        disabledDate={(current) => isDateDisabledForAction(current, "import-request-create", configuration)}
                        onChange={handleStartDateChange}
                        placeholder="Chọn ngày"
                        allowClear
                      />
                    </div>
                    <div className="w-1/2 mb-2">
                      <label className="text-base font-semibold">Ngày hết hạn<span className="text-red-500">*</span></label>
                      <DatePicker
                        locale={locale}
                        format="DD-MM-YYYY"
                        size="large"
                        className="w-full !mt-1 !p-[4px_8px]"
                        value={formData.endDate ? dayjs(formData.endDate) : null}
                        disabledDate={(current) => isDateDisabledForAction(current, "import-request-create", configuration, formData.startDate)}
                        onChange={handleEndDateChange}
                        placeholder="Chọn ngày"
                        allowClear
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-base font-semibold">Lý do nhập kho<span className="text-red-500">*</span></label>
                    <TextArea
                      placeholder="Nhập lý do"
                      rows={4}
                      value={formData.importReason}
                      onChange={(e) => setFormData({ ...formData, importReason: e.target.value.slice(0, 150) })}
                      className="w-full !mt-1"
                      maxLength={150}
                      showCount
                    />
                  </div>
                  <Button
                    type="primary"
                    onClick={() => setShowConfirmModal(true)}
                    loading={loading}
                    className="w-full mt-2"
                    id="btn-detail"
                    disabled={importedData.length === 0 || !isImportRequestDataValid || !isFormDataValid()}
                  >
                    Xác nhận thông tin
                  </Button>
                </Space>
              </Card>
              <div className="w-7/10">
                <Card title={<span className="text-xl font-semibold">Danh sách hàng hóa từ file Excel</span>}>
                  {sortedData.length > 0 && (
                    <Alert
                      message="Thông tin nhập kho"
                      description={
                        <>
                          <p>Số lượng nhà cung cấp: {Array.from(new Set(sortedData.map(item => item.providerId))).length}</p>
                          <p>Tổng số mặt hàng: {sortedData.length}</p>
                          <p className="text-blue-500">Hệ thống sẽ tự động tạo phiếu nhập kho riêng theo từng nhà cung cấp</p>
                          <p className="text-orange-500">* Các mặt hàng có cùng mã và nhà cung cấp đã được gộp số lượng</p>
                        </>
                      }
                      type="info"
                      showIcon
                      className="mb-4"
                    />
                  )}
                </Card>
                <Table
                  className="[&_.ant-table-cell]:!p-3"
                  columns={columns}
                  dataSource={sortedData}
                  rowKey={(record, index) => `${record.itemId}-${record.providerId}-${index}`}
                  loading={false}
                  pagination={{
                    ...pagination,
                    showTotal: (total: number) => `Tổng ${total} mục`,
                  }}
                  onChange={handleChangePage}
                  locale={{ emptyText: "Không có dữ liệu" }}
                />
              </div>
            </div>
          )}

          <Modal
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                Những mã hàng sau sẽ bị loại bỏ do số lượng bằng 0
              </div>
            }
            open={isDeleteQuantityZeroRowModalOpen}
            onOk={confirmDeleteQuantityZeroRow}
            onCancel={cancelDeleteQuantityZeroRow}
            okText="Xác nhận và tiếp tục"
            cancelText="Hủy"
            okButtonProps={{ disabled: !deleteQuantityZeroRowsResponsibilityChecked }}
            width={540}
            maskClosable={false}
          >
            {quantityZeroRowsToDelete.length > 0 && (
              <>
                <div
                  ref={deleteModalScrollRef}
                  onScroll={checkDeleteModalScroll}
                  style={{
                    height: quantityZeroRowsToDelete.length > 5 ? "540px" : "auto",
                    overflowY: quantityZeroRowsToDelete.length > 5 ? "auto" : "visible",
                    marginBottom: 16
                  }}
                >
                  {quantityZeroRowsToDelete.map((item, index) => (
                    <div key={`${item.itemId}-${item.providerId}-${index}`} className="pb-2 mb-2 border-b">
                      <p><strong>Mã hàng:</strong> #{item.itemId}</p>
                      <p><strong>Tên hàng:</strong> {item.itemName}</p>
                      <p><strong>Nhà cung cấp:</strong> {item.providerName}</p>
                    </div>
                  ))}
                </div>
                <Checkbox
                  checked={deleteQuantityZeroRowsResponsibilityChecked}
                  onChange={e => setDeleteQuantityZeroRowsResponsibilityChecked(e.target.checked)}
                  style={{ marginTop: 8, fontSize: 14, fontWeight: "bold" }}
                  disabled={quantityZeroRowsToDelete.length > 3 && !hasScrolledToBottomInDeleteModal}
                >
                  Tôi xác nhận số lượng là đúng và đồng ý tiếp tục.
                  {quantityZeroRowsToDelete.length > 3 && !hasScrolledToBottomInDeleteModal && (
                    <div style={{ color: 'red' }}>(Vui lòng xem hết danh sách)</div>
                  )}
                </Checkbox>
              </>
            )}
          </Modal>

          <ImportRequestOrderConfirmModal
            open={showConfirmModal}
            onOk={handleSubmit}
            onCancel={() => setShowConfirmModal(false)}
            confirmLoading={loading}
            formData={formData}
            details={getConsolidatedData(importedData)}
            providers={providers.reduce((providerNameMap, provider) => {
              providerNameMap[provider.id] = provider.name;
              return providerNameMap;
            }, {} as Record<number, string>)}
          />
        </>
      )}
    </>
  );
};

export default ImportRequestOrderTypeCreating;