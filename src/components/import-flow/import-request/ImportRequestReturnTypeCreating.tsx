import React, { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import * as XLSX from "xlsx";
import { Button, Input, Typography, Space, Card, Alert, Table, DatePicker, ConfigProvider, Steps, Modal, Checkbox } from "antd";
import useImportRequestService from "@/services/useImportRequestService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import ExcelUploadSection from "@/components/commons/ExcelUploadSection";
import { ArrowRightOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";
import { isDateDisabledForAction } from "@/utils/helpers";
import useConfigurationService, { ConfigurationDto } from "@/services/useConfigurationService";
import { ImportRequestType } from "@/components/commons/RequestTypeSelector";
import { useScrollViewTracker } from "@/hooks/useScrollViewTracker";
import EditableImportRequestReturnTable from "./EditableImportRequestReturnTable";
import DepartmentSelectionModal from "@/components/commons/DepartmentSelectionModal";
import useDepartmentService from "@/services/useDepartmentService";
import ImportRequestReturnConfirmModal from "./ImportRequestReturnConfirmModal";
import { ItemResponse } from "@/services/useItemService";

const { TextArea } = Input;

interface ImportRequestReturnTypeProps {
  onStepChange?: (step: number) => void;
  itemLoading: boolean;
  items: ItemResponse[];
}

interface ReturnImportDetailRow {
  inventoryItemId: string;
  measurementValue: number;
}

interface FormData {
  importReason: string;
  importType: ImportRequestType;
  startDate: string;
  endDate: string;
  departmentId: number | null;
  returnImportRequestDetails: ReturnImportDetailRow[];
}

const ImportRequestReturnTypeCreating: React.FC<ImportRequestReturnTypeProps> = ({
  onStepChange,
  itemLoading,
  items
}) => {
  const importType: ImportRequestType = "RETURN";

  // ========== ROUTER & PARAMS ==========
  const navigate = useNavigate();

  // ========== DATA STATES ==========
  const [importedData, setImportedData] = useState<ReturnImportDetailRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [configuration, setConfiguration] = useState<ConfigurationDto | null>(null);
  const [formData, setFormData] = useState<FormData>({
    importReason: "",
    importType,
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: dayjs().add(1, 'day').format("YYYY-MM-DD"),
    departmentId: null,
    returnImportRequestDetails: []
  });
  const [isImportRequestDataValid, setIsImportRequestDataValid] = useState<boolean>(false);
  const [isAllPagesViewed, setIsAllPagesViewed] = useState<boolean>(false);
  const [hasValidationErrors, setHasValidationErrors] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // ========== UI & FORM STATES ==========
  const [step, setStep] = useState<number>(0);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Notify parent component when step changes
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);


  // ========== SERVICES ==========
  const {
    loading: importRequestLoading,
    createReturnImportRequest
  } = useImportRequestService();

  const {
    getConfiguration
  } = useConfigurationService();

  const { getAllDepartments, departments } = useDepartmentService();

  // ========== COMPUTED VALUES ==========
  const loading = itemLoading || importRequestLoading;

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
    if (!formData.importReason || !formData.startDate || !formData.endDate || !formData.departmentId) {
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

  const getConsolidatedData = (originalData: ReturnImportDetailRow[]): ReturnImportDetailRow[] => {
    const groupedData: { [key: string]: ReturnImportDetailRow } = {};

    originalData.forEach((item) => {
      const key = item.inventoryItemId;

      if (groupedData[key]) {
        groupedData[key].measurementValue += item.measurementValue;
      } else {
        groupedData[key] = { ...item };
      }
    });

    return Object.values(groupedData);
  };

  // ========== COMPUTED VALUES & FILTERING ==========
  const sortedData = useMemo(() => {
    if (step === 1) {
      return [...getConsolidatedData(importedData)].sort((a, b) => a.inventoryItemId.localeCompare(b.inventoryItemId));
    }
    return [...importedData].sort((a, b) => a.inventoryItemId.localeCompare(b.inventoryItemId));
  }, [importedData, step]);

  // ========== USE EFFECTS ==========
  useEffect(() => {
    const fetchConfiguration = async () => {
      const configuration = await getConfiguration();
      setConfiguration(configuration);
    };
    fetchConfiguration();
  }, []);

  useEffect(() => {
    getAllDepartments(1, 100);
  }, []);

  useEffect(() => {
    if (configuration?.maxAllowedDaysForImportRequestProcess) {
      setFormData(prev => ({
        ...prev,
        endDate: dayjs(prev.startDate).add(configuration.maxAllowedDaysForImportRequestProcess, 'day').format("YYYY-MM-DD")
      }));
    }
  }, [configuration]);


  // Update formData when importType prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      importType: importType
    }));
  }, [importType]);

  // ========== EVENT HANDLERS ==========

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
              "NHẬP TRẢ": "RETURN",
              "RETURN": "RETURN",
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
              const inventoryItemIdCell = ws[XLSX.utils.encode_cell({ r: rowNum, c: 1 })]; // Column B - Mã sản phẩm tồn kho
              const measurementValueCell = ws[XLSX.utils.encode_cell({ r: rowNum, c: 2 })]; // Column C - Giá trị cần nhập

              // Skip header row and empty rows
              if (sttCell && String(sttCell.v).trim() === "Số thứ tự") continue;
              if (!inventoryItemIdCell || !measurementValueCell) continue;

              const inventoryItemId = String(inventoryItemIdCell.v).trim();
              const measurementValue = String(measurementValueCell.v).trim();

              if (inventoryItemId && measurementValue &&
                !isNaN(Number(measurementValue)) &&
                Number(measurementValue) >= 0) {
                row.inventoryItemId = inventoryItemId;
                row.measurementValue = Number(measurementValue);
                jsonData.push(row);
              }
            }

            const transformedData: ReturnImportDetailRow[] = jsonData.map((item: any, index: number) => {
              const inventoryItemId = item.inventoryItemId;
              const measurementValue = item.measurementValue;

              if (!inventoryItemId || measurementValue === undefined) {
                throw new Error(`Row ${index + 10}: Missing inventory item ID or measurement value`);
              }

              return {
                inventoryItemId: inventoryItemId,
                measurementValue: Number(measurementValue),
              };
            });

            setImportedData(transformedData);
            setIsImportRequestDataValid(true);
            setIsAllPagesViewed(true); // For return type, we don't need the scroll tracking

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
    setHasValidationErrors(false);
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

    const requestData = {
      importReason: formData.importReason,
      importType: formData.importType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      departmentId: formData.departmentId,
      returnImportRequestDetails: getConsolidatedData(importedData)
    };

    await createReturnImportRequest(requestData);

    navigate(ROUTES.PROTECTED.IMPORT.REQUEST.LIST);
    setFormData({
      importReason: "",
      importType: importType,
      startDate: dayjs().format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD"),
      departmentId: null,
      returnImportRequestDetails: []
    });
    setSelectedDepartment(null);
    setFile(null);
    setFileName("");
    setImportedData([]);
  };

  // ========== STEP HANDLERS ==========
  const handleNextStep = () => {
    if (hasValidationErrors) {
      toast.error("Vui lòng sửa các lỗi trong bảng dữ liệu trước khi tiếp tục");
      return;
    }

    setStep(1);
  };


  // ========== COMPUTED VALUES & RENDER LOGIC ==========

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
              disabled: importedData.length === 0 || !isImportRequestDataValid || !isAllPagesViewed || hasValidationErrors
            }
          ]}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-600 font-medium">Đang tải dữ liệu cấu hình và phòng ban...</span>
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
                  type="IMPORT_RETURN"
                />

                <EditableImportRequestReturnTable
                  setIsAllPagesViewed={setIsAllPagesViewed}
                  data={importedData}
                  setData={setImportedData}
                  relatedItemsData={items}
                  onValidationChange={setHasValidationErrors}
                  alertNode={importedData.length > 0 ? (
                    <Alert
                      message="Thông tin nhập trả"
                      description={
                        <>
                          <p>Tổng số mặt hàng: {importedData.length}</p>
                          <p className="text-blue-500">Hệ thống sẽ tự động tạo phiếu nhập trả dựa trên dữ liệu từ file</p>
                        </>
                      }
                      type="info"
                      showIcon
                      className="mb-4"
                    />
                  ) : null}
                  emptyText="Vui lòng tải lên file Excel để xem chi tiết hàng hóa"
                  title="Danh sách hàng hóa trả từ file Excel"
                />
              </div>
              <Button
                type="primary"
                onClick={handleNextStep}
                disabled={importedData.length === 0 || !isImportRequestDataValid || !isAllPagesViewed || hasValidationErrors}
              >
                Tiếp tục nhập thông tin phiếu nhập
                <ArrowRightOutlined />
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
                    <label className="text-base font-semibold">Phòng ban<span className="text-red-500">*</span></label>
                    <Input
                      value={
                        selectedDepartment
                          ? selectedDepartment.departmentName
                          : ""
                      }
                      placeholder="Chọn phòng ban"
                      readOnly
                      onClick={() => setDepartmentModalVisible(true)}
                      className="w-full cursor-pointer"
                    />
                    {!selectedDepartment && (
                      <div className="text-red-500 text-xs mt-1">
                        Vui lòng chọn phòng ban.
                      </div>
                    )}
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
                    onClick={() => setIsConfirmModalOpen(true)}
                    loading={loading}
                    className="w-full mt-2"
                    id="btn-detail"
                    disabled={importedData.length === 0 || !isImportRequestDataValid || !isFormDataValid()}
                  >
                    Xác nhận thông tin phiếu nhập trả
                  </Button>
                </Space>
              </Card>
              <div className="w-7/10">
                <Card title={<span className="text-xl font-semibold">Danh sách hàng hóa trả từ file Excel</span>}>
                  {sortedData.length > 0 && (
                    <Alert
                      message="Thông tin nhập tXác nhận thông tin phiếu nhập trảrả"
                      description={
                        <>
                          <p>Tổng số mặt hàng: {sortedData.length}</p>
                          <p className="text-blue-500">Hệ thống sẽ tự động tạo phiếu nhập trả dựa trên dữ liệu từ file</p>
                          <p className="text-orange-500">* Các mặt hàng có cùng mã sản phẩm tồn kho đã được gộp giá trị</p>
                        </>
                      }
                      type="info"
                      showIcon
                      className="mb-4"
                    />
                  )}
                  <Table
                    className="[&_.ant-table-cell]:!p-3"
                    columns={[
                      {
                        width: "40%",
                        title: <span className="font-semibold">Mã sản phẩm tồn kho</span>,
                        dataIndex: "inventoryItemId",
                        key: "inventoryItemId",
                        onHeaderCell: () => ({
                          style: { textAlign: 'center' as const }
                        }),
                      },
                      {
                        width: "20%",
                        title: <span className="font-semibold">Giá trị cần nhập</span>,
                        dataIndex: "measurementValue",
                        key: "measurementValue",
                        align: "right" as const,
                        onHeaderCell: () => ({
                          style: { textAlign: 'center' as const }
                        }),
                      },
                      {
                        width: "10%",
                        title: <span className="font-semibold">Đơn vị</span>,
                        dataIndex: "unitType",
                        key: "unitType",
                        align: "left" as const,
                        onHeaderCell: () => ({
                          style: { textAlign: 'center' as const }
                        }),
                        render: (value: string, record: ReturnImportDetailRow) => {
                          const mappedItem = items.find(item => item.inventoryItemIds.includes(record.inventoryItemId));
                          return (
                            <div>
                              {mappedItem?.measurementUnit || '-'}
                            </div>
                          );
                        },
                      },
                      {
                        width: "20%",
                        title: <span className="font-semibold">Tối đa cho phép</span>,
                        dataIndex: "unitType",
                        key: "unitType",
                        align: "center" as const,
                        render: (value: string, record: ReturnImportDetailRow) => {
                          const mappedItem = items.find(item => item.inventoryItemIds.includes(record.inventoryItemId));
                          return (
                            <div>
                              {mappedItem?.measurementValue || '-'} {mappedItem?.measurementUnit || '-'} / {mappedItem?.unitType || '-'}
                            </div>
                          );
                        },
                      },
                    ]}
                    dataSource={sortedData}
                    rowKey={(record, index) => `${record.inventoryItemId}-${index}`}
                    loading={false}
                    pagination={{
                      current: 1,
                      pageSize: 10,
                      showTotal: (total: number) => `Tổng ${total} mục`,
                    }}
                    locale={{ emptyText: "Không có dữ liệu" }}
                  />
                </Card>
              </div>
            </div>
          )}


          <DepartmentSelectionModal
            visible={departmentModalVisible}
            title="Chọn phòng ban"
            data={departments?.map((d) => ({
              ...d,
              name: d.departmentName,
            })) || []}
            onSelect={(dept) => {
              setSelectedDepartment(dept);
              setFormData(prev => ({ ...prev, departmentId: dept.id }));
              setDepartmentModalVisible(false);
            }}
            onCancel={() => setDepartmentModalVisible(false)}
            placeholder="Tìm kiếm phòng ban..."
          />

          <ImportRequestReturnConfirmModal
            open={isConfirmModalOpen}
            onOk={handleSubmit}
            onCancel={() => setIsConfirmModalOpen(false)}
            confirmLoading={loading}
            formData={formData}
            details={getConsolidatedData(importedData)}
            departmentName={selectedDepartment?.departmentName || ""}
            relatedItemsData={items}
          />
        </>
      )}
    </>
  );
};

export default ImportRequestReturnTypeCreating;