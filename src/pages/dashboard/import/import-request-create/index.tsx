import React, { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import * as XLSX from "xlsx";
import { Button, Input, Select, Typography, Space, Card, Alert, Table, DatePicker, ConfigProvider, Steps } from "antd";
import ImportRequestConfirmModal from "@/components/import-flow/ImportRequestConfirmModal";
import useProviderService, { ProviderResponse } from "@/services/useProviderService";
import useItemService, { ItemResponse } from "@/services/useItemService";
import useImportRequestDetailService, { ImportRequestCreateWithDetailRequest } from "@/services/useImportRequestDetailService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import ExcelUploadSection from "@/components/commons/ExcelUploadSection";
import EditableImportRequestTableSection from "@/components/import-flow/EditableImportRequestTableSection";
import { ArrowLeftOutlined, ArrowRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { ImportRequestDetailRow } from "@/utils/interfaces";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";
import { calculateRowSpanForItemHaveSameCompareValue, isDateDisabledForAction } from "@/utils/helpers";
import useConfigurationService, { ConfigurationDto } from "@/services/useConfigurationService";
import RequestTypeSelector, { ImportRequestType } from "@/components/commons/RequestTypeSelector";
const { TextArea } = Input;

interface FormData {
  importReason: string;
  importType: ImportRequestType;
  exportRequestId: number | null;
  startDate: string;
  endDate: string;
}

const ImportRequestCreate: React.FC = () => {
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
    importType: "ORDER",
    exportRequestId: null,
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: dayjs().add(1, 'day').format("YYYY-MM-DD"),
  });
  const [providers, setProviders] = useState<ProviderResponse[]>([]);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [isImportRequestDataValid, setIsImportRequestDataValid] = useState<boolean>(false);
  const [isAllPagesViewed, setIsAllPagesViewed] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== UI & FORM STATES ==========
  const [step, setStep] = useState<number>(0);

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

  // New validation function to check if form data is valid
  const isFormDataValid = (): boolean => {
    if (!formData.importReason || !formData.startDate || !formData.endDate) {
      return false;
    }

    // Check if startDate is today or later
    const startDate = dayjs(formData.startDate);
    const today = dayjs().startOf('day');
    if (startDate.isBefore(today)) {
      return false;
    }

    // Check if endDate is valid
    if (!isEndDateValid(formData.startDate, formData.endDate)) {
      return false;
    }

    return true;
  };

  const downloadTemplate = () => {
    // Tạo worksheet rỗng
    const ws = XLSX.utils.aoa_to_sheet([]);

    // Thêm thông tin header
    XLSX.utils.sheet_add_aoa(ws, [
      ["importType", "ORDER"],
      ["importReason", "Nhập hàng từ nhà cung cấp"],
      [], // Dòng trống để tách biệt
      ["itemId", "quantity", "providerId"], // Header cho dữ liệu
      ["{Mã hàng}", "{Số lượng - Ví dụ: 10}", "{Mã Nhà cung cấp}"] // Dữ liệu mẫu
    ], { origin: "A1" });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "import_request_template.xlsx");
  };

  const getConsolidatedData = (originalData: ImportRequestDetailRow[]): ImportRequestDetailRow[] => {
    const groupedData: { [key: string]: ImportRequestDetailRow } = {};

    originalData.forEach((item) => {
      const key = `${item.itemId}-${item.providerId}`;

      if (groupedData[key]) {
        // Nếu đã tồn tại, cộng thêm số lượng
        groupedData[key].quantity += item.quantity;
      } else {
        // Nếu chưa tồn tại, thêm mới
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

  // Update endDate when configuration is loaded
  useEffect(() => {
    if (configuration?.maxAllowedDaysForImportRequestProcess) {
      setFormData(prev => ({
        ...prev,
        endDate: dayjs(prev.startDate).add(configuration.maxAllowedDaysForImportRequestProcess, 'day').format("YYYY-MM-DD")
      }));
    }
  }, [configuration]);

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

    // Calculate new endDate based on configuration
    let newEndDate = formData.endDate;
    if (newStartDate && configuration?.maxAllowedDaysForImportRequestProcess) {
      newEndDate = dayjs(newStartDate).add(configuration.maxAllowedDaysForImportRequestProcess, 'day').format("YYYY-MM-DD");
    }

    // Check if the calculated endDate is valid
    if (newStartDate && newEndDate) {
      if (!isEndDateValid(newStartDate, newEndDate)) {
        // If not valid, clear endDate
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
            // Đọc importType từ B1
            const importTypeCell = ws['B1'];
            const importType = importTypeCell ? importTypeCell.v : null;

            // Đọc importReason từ B2
            const importReasonCell = ws['B2'];
            const importReason = importReasonCell ? importReasonCell.v : "";

            // Cập nhật formData nếu có dữ liệu từ file
            if (importType && (importType === "ORDER" || importType === "RETURN")) {
              setFormData(prev => ({
                ...prev,
                importType: importType as ImportRequestType,
                importReason: importReason || prev.importReason
              }));
            }
            // Đọc dữ liệu từ dòng 5 trở đi (bỏ qua header ở dòng 1,2,3,4)
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            const jsonData = [];

            for (let rowNum = 4; rowNum <= range.e.r; rowNum++) { // Bắt đầu từ dòng 5 (index 4)
              const row: any = {};
              const itemIdCell = ws[XLSX.utils.encode_cell({ r: rowNum, c: 0 })]; // Column A
              const quantityCell = ws[XLSX.utils.encode_cell({ r: rowNum, c: 1 })]; // Column B
              const providerIdCell = ws[XLSX.utils.encode_cell({ r: rowNum, c: 2 })]; // Column C

              if (itemIdCell && quantityCell && providerIdCell) {
                row.itemId = itemIdCell.v;
                row.quantity = quantityCell.v;
                row.providerId = providerIdCell.v;
                jsonData.push(row);
              }
            }

            const transformedData: ImportRequestDetailRow[] = jsonData.map((item: any, index: number) => {
              const itemId = item.itemId;
              const quantity = item.quantity;
              const providerId = item.providerId;

              if (!itemId || !quantity || !providerId) {
                throw new Error(`Dòng ${index + 5}: Thiếu thông tin Mã hàng, Số lượng hoặc Nhà cung cấp`);
              }

              const foundItem = items.find(i => i.id === itemId);
              if (!foundItem) {
                throw new Error(`Dòng ${index + 5}: Không tìm thấy mặt hàng với mã ${itemId}`);
              }

              const foundProvider = providers.find(p => p.id === Number(providerId));
              if (!foundProvider) {
                throw new Error(`Dòng ${index + 5}: Không tìm thấy nhà cung cấp với ID ${providerId}`);
              }

              // Validate the provider is actually linked to the item
              if (!Array.isArray(foundItem.providerIds) || !foundItem.providerIds.includes(Number(providerId))) {
                throw new Error(`Dòng ${index + 5}: Nhà cung cấp ID ${providerId} không phải là nhà cung cấp của mặt hàng mã ${itemId}`);
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
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRequestTypeChange = (value: ImportRequestType) => {
    handleRemoveFile();
    setFormData({ ...formData, importType: value });
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
      importType: "ORDER",
      exportRequestId: null,
      startDate: dayjs().format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD"),
    });
    setFile(null);
    setFileName("");
    setImportedData([]);
  };

  // ========== NAVIGATION HANDLERS ==========
  const handleBack = () => {
    if (step === 0) {
      navigate(ROUTES.PROTECTED.IMPORT.REQUEST.LIST);
    } else {
      setStep(0);
    }
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
    <div className="container mx-auto p-3 pt-0">
      <div className="flex items-center mb-2">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
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
              title: <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Tải lên file Excel</span>,
            },
            {
              title: <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Xác nhận thông tin</span>,
              disabled: importedData.length === 0 || !isImportRequestDataValid || !isAllPagesViewed
            }
          ]}
        />
      </div>

      {step === 0 && (
        <>
          <RequestTypeSelector
            requestType={formData.importType}
            setRequestType={handleRequestTypeChange}
            mode="import"
          />
          <div className="mt-2 flex flex-col items-center gap-6">
            <div className="w-full">
              <ExcelUploadSection
                fileName={fileName}
                onFileChange={handleFileUpload}
                onDownloadTemplate={downloadTemplate}
                onRemoveFile={handleRemoveFile}
                fileInputRef={fileInputRef}
                buttonLabel="Tải lên file Excel"
              />
              <EditableImportRequestTableSection
                setIsAllPagesViewed={setIsAllPagesViewed}
                data={importedData} // Sử dụng data gốc
                setData={setImportedData}
                items={items}
                providers={providers}
                loading={false}
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
              onClick={() => setStep(1)}
              disabled={importedData.length === 0 || !isImportRequestDataValid || !isAllPagesViewed}
            >
              Tiếp tục nhập thông tin phiếu nhập
              <ArrowRightOutlined />
              {!isAllPagesViewed && isImportRequestDataValid && <span style={{ color: 'red', marginLeft: 4 }}>(Vui lòng xem tất cả các trang)</span>}
            </Button>
          </div>
        </>
      )}
      {step === 1 && (
        <div className="mt-4 flex gap-6">
          <Card title={<span className="text-xl font-semibold">Thông tin phiếu nhập</span>} className="w-3/10">
            <Space direction="vertical" className="w-full">
              <div className="text-sm text-blue-500">
                <InfoCircleOutlined className="mr-1" />
                Ngày hết hạn không được quá <span className="font-bold">{configuration?.maxAllowedDaysForImportRequestProcess} ngày</span> kể từ ngày bắt đầu
              </div>
              <div className="flex gap-6 mb-4">
                <div className="mb-2 w-1/2">
                  <label className="text-base font-semibold">Ngày có hiệu lực<span className="text-red-500">*</span></label>
                  <ConfigProvider direction="rtl">
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
                  </ConfigProvider>
                </div>
                <div className="mb-2 w-1/2">
                  <label className="text-base font-semibold">Ngày hết hạn<span className="text-red-500">*</span></label>
                  <ConfigProvider direction="rtl">
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
                  </ConfigProvider>
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
              dataSource={sortedData} // Sử dụng data đã gộp
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
      <ImportRequestConfirmModal
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
    </div>
  );
};

export default ImportRequestCreate;
