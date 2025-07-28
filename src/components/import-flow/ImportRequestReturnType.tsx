import React, { useState, useEffect } from "react";
import { Button, Input, Space, Card, Alert, Table, DatePicker, Steps, Select } from "antd";
import ImportRequestConfirmModal from "@/components/import-flow/ImportRequestConfirmModal";
import useProviderService, { ProviderResponse } from "@/services/useProviderService";
import useItemService, { ItemResponse } from "@/services/useItemService";
import useImportRequestDetailService, { ImportRequestCreateWithDetailRequest } from "@/services/useImportRequestDetailService";
import useExportRequestService, { ExportRequestResponse } from "@/services/useExportRequestService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { ArrowLeftOutlined, ArrowRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { ImportRequestDetailRow } from "@/utils/interfaces";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";
import { calculateRowSpanForItemHaveSameCompareValue, isDateDisabledForAction } from "@/utils/helpers";
import useConfigurationService, { ConfigurationDto } from "@/services/useConfigurationService";
import { ImportRequestType } from "@/components/commons/RequestTypeSelector";

const { TextArea } = Input;
const { Option } = Select;

interface FormData {
  importReason: string;
  importType: ImportRequestType;
  exportRequestId: number | null;
  startDate: string;
  endDate: string;
}

const ImportRequestReturnType: React.FC = () => {
  const importType: ImportRequestType = "RETURN";
  // ========== ROUTER & PARAMS ==========
  const navigate = useNavigate();

  // ========== DATA STATES ==========
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedExportRequest, setSelectedExportRequest] = useState<ExportRequestResponse | null>(null);
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
  const [exportRequests, setExportRequests] = useState<ExportRequestResponse[]>([]);
  const [exportRequestDetails, setExportRequestDetails] = useState<ImportRequestDetailRow[]>([]);

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
    loading: exportRequestLoading,
    getAllExportRequests
  } = useExportRequestService();

  const {
    getConfiguration
  } = useConfigurationService();

  // ========== COMPUTED VALUES ==========
  const loading = providerLoading || itemLoading || importRequestDetailLoading || exportRequestLoading;

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
    if (!formData.importReason || !formData.startDate || !formData.endDate || !formData.exportRequestId) {
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

  // Filter export requests by type (RETURN or BORROWING)
  const filteredExportRequests = exportRequests.filter(request =>
    request.type === "RETURN" || request.type === "BORROWING"
  );

  // ========== USE EFFECTS ==========
  useEffect(() => {
    const fetchData = async () => {
      const [providersResponse, itemsResponse, exportRequestsResponse] = await Promise.all([
        getAllProviders(),
        getItems(),
        getAllExportRequests()
      ]);

      if (providersResponse?.content && itemsResponse?.content) {
        setProviders(providersResponse.content);
        setItems(itemsResponse.content);
      }

      if (exportRequestsResponse?.content) {
        setExportRequests(exportRequestsResponse.content);
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

  const handleExportRequestSelect = (exportRequestId: string) => {
    const selected = exportRequests.find(request => request.exportRequestId === exportRequestId);
    setSelectedExportRequest(selected || null);
    setFormData({ ...formData, exportRequestId: Number(exportRequestId) });

    // Here you would typically fetch the details of the selected export request
    // For now, we'll create mock data based on the selected export request
    if (selected) {
      // TODO: Replace this with actual API call to get export request details
      setExportRequestDetails([]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedExportRequest || exportRequestDetails.length === 0) {
      toast.error("Vui lòng chọn phiếu xuất và đảm bảo có dữ liệu hợp lệ");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc");
      return;
    }

    const details: ImportRequestCreateWithDetailRequest[] = exportRequestDetails.map(row => ({
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
    setSelectedExportRequest(null);
    setExportRequestDetails([]);
  };

  const handleNextStep = () => {
    setStep(1);
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
        const currentPageData = exportRequestDetails.slice(startIndex, endIndex);

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
              title: <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Chọn phiếu xuất</span>,
            },
            {
              title: <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Xác nhận thông tin</span>,
              disabled: !selectedExportRequest || !formData.exportRequestId
            }
          ]}
        />
      </div>

      {step === 0 && (
        <div className="mt-4 flex gap-6">
          <Card title={<span className="text-lg font-semibold">Chọn phiếu xuất mượn để tiến hành nhập trả</span>} className="w-2/5">
            <Space direction="vertical" className="w-full">
              <div className="mb-4">
                <label className="text-base font-semibold">Mã phiếu xuất<span className="text-red-500">*</span></label>
                <Select
                  size="middle"
                  className="w-full !mt-1"
                  placeholder="Chọn phiếu xuất"
                  value={selectedExportRequest?.exportRequestId || undefined}
                  onChange={handleExportRequestSelect}
                  loading={exportRequestLoading}
                >
                  {filteredExportRequests.map(request => (
                    <Option key={request.exportRequestId} value={request.exportRequestId}>
                      #{request.exportRequestId} - {request.type} - {dayjs(request.exportDate).format("DD/MM/YYYY")}
                    </Option>
                  ))}
                </Select>
              </div>
            </Space>
          </Card>

          <div className="w-[85%]">
            <Card title={<span className="text-lg font-semibold">Thông tin phiếu xuất</span>}>
              {selectedExportRequest ? (
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">Mã phiếu xuất:</span> #{selectedExportRequest.exportRequestId}
                  </div>
                  <div>
                    <span className="font-semibold">Loại phiếu xuất:</span> {selectedExportRequest.type}
                  </div>
                  <div>
                    <span className="font-semibold">Ngày xuất:</span> {dayjs(selectedExportRequest.exportDate).format("DD/MM/YYYY")}
                  </div>
                  <div>
                    <span className="font-semibold">Lý do xuất:</span> {selectedExportRequest.exportReason}
                  </div>
                  <div>
                    <span className="font-semibold">Người nhận:</span> {selectedExportRequest.receiverName}
                  </div>
                  <div>
                    <span className="font-semibold">Trạng thái:</span> {selectedExportRequest.status}
                  </div>
                  {selectedExportRequest.expectedReturnDate && (
                    <div>
                      <span className="font-semibold">Ngày trả dự kiến:</span> {dayjs(selectedExportRequest.expectedReturnDate).format("DD/MM/YYYY")}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  Vui lòng chọn phiếu xuất để xem thông tin chi tiết
                </div>
              )}
            </Card>
          </div>
        </div>
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
                <div className="mb-2 w-1/2">
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
                disabled={!isFormDataValid()}
              >
                Xác nhận thông tin
              </Button>
            </Space>
          </Card>
          <div className="w-7/10">
            <Card title={<span className="text-xl font-semibold">Danh sách hàng hóa từ phiếu xuất</span>}>
              {exportRequestDetails.length > 0 ? (
                <Alert
                  message="Thông tin nhập kho"
                  type="info"
                  showIcon
                  className="mb-4"
                />
              ) : (
                <Alert
                  message="Chưa có dữ liệu"
                  description="Danh sách hàng hóa sẽ được hiển thị sau khi chọn phiếu xuất"
                  type="warning"
                  showIcon
                  className="mb-4"
                />
              )}
            </Card>
            <Table
              className="[&_.ant-table-cell]:!p-3"
              columns={columns}
              dataSource={exportRequestDetails}
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
      <div className="mt-4 w-[20%] mx-auto">
      <Button
        type="primary"
        onClick={handleNextStep}
        disabled={!selectedExportRequest}
        className="w-full"
      >
        Tiếp tục nhập thông tin phiếu nhập
        <ArrowRightOutlined />
      </Button>
      </div>

      <ImportRequestConfirmModal
        open={showConfirmModal}
        onOk={handleSubmit}
        onCancel={() => setShowConfirmModal(false)}
        confirmLoading={loading}
        formData={formData}
        details={exportRequestDetails}
        providers={providers.reduce((providerNameMap, provider) => {
          providerNameMap[provider.id] = provider.name;
          return providerNameMap;
        }, {} as Record<number, string>)}
      />
    </>
  );
};

export default ImportRequestReturnType;