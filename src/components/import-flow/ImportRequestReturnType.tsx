import React, { useState, useEffect } from "react";
import { Button, Input, Space, Card, Alert, Table, DatePicker, Steps, Select, Descriptions } from "antd";
import ImportRequestConfirmModal from "@/components/import-flow/ImportRequestConfirmModal";
import useItemService, { ItemResponse } from "@/services/useItemService";
import useImportRequestDetailService, { ImportRequestCreateWithDetailRequest } from "@/services/useImportRequestDetailService";
import useExportRequestService, { ExportRequestResponse } from "@/services/useExportRequestService";
import useExportRequestDetailService from "@/services/useExportRequestDetailService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { ArrowRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { FormData, ImportRequestDetailRow } from "@/utils/interfaces";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";
import { isDateDisabledForAction } from "@/utils/helpers";
import useConfigurationService, { ConfigurationDto } from "@/services/useConfigurationService";
import { ImportRequestType } from "@/components/commons/RequestTypeSelector";
import useImportRequestService from "@/services/useImportRequestService";

const { TextArea } = Input;
const { Option } = Select;

interface ImportRequestReturnTypeProps {
  onStepChange?: (step: number) => void;
}

const ImportRequestReturnType: React.FC<ImportRequestReturnTypeProps> = ({
  onStepChange
}) => {
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
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [exportRequests, setExportRequests] = useState<ExportRequestResponse[]>([]);
  const [exportRequestDetails, setExportRequestDetails] = useState<any[]>([]);

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
    loading: importRequestLoading,
    createReturnImportRequest
  } = useImportRequestService();

  const {
    loading: itemLoading,
    getItems
  } = useItemService();

  const {
    loading: exportRequestLoading,
    getAllExportRequests
  } = useExportRequestService();

  const { getExportRequestDetails, loading: exportRequestDetailLoading } =
    useExportRequestDetailService();

  const {
    getConfiguration,
  } = useConfigurationService();

  // ========== COMPUTED VALUES ==========
  const loading = itemLoading || importRequestLoading || exportRequestLoading || exportRequestDetailLoading;

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
    request.type === "INTERNAL"
  );

  // ========== UTILITY FUNCTIONS FOR EXPORT REQUEST DETAILS ==========
  const enrichWithItemsData = (exportRequestDetails: any[], itemsData: ItemResponse[]) => {
    return exportRequestDetails.map((detail) => {
      const itemInfo = itemsData.find(
        (item) => String(item.id) === String(detail.itemId)
      );
      return {
        ...detail,
        itemName: itemInfo?.name || detail.itemName || "Không xác định",
        unitType: itemInfo?.unitType || "",
        measurementUnit: itemInfo?.measurementUnit || "",
      };
    });
  };

  const fetchExportRequestDetails = async (exportRequestId: string) => {
    try {
      const response = await getExportRequestDetails(exportRequestId, 1, 1000);
      if (response && response.content && items.length > 0) {
        const enriched = enrichWithItemsData(response.content, items);
        setExportRequestDetails(enriched);
      }
    } catch (error) {
      console.error("Error fetching export request details:", error);
      setExportRequestDetails([]);
    }
  };

  // ========== USE EFFECTS ==========
  useEffect(() => {
    const fetchData = async () => {
      const [itemsResponse, exportRequestsResponse] = await Promise.all([
        getItems(),
        getAllExportRequests()
      ]);

      if (itemsResponse?.content) {
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

  // Fetch export request details when items are loaded and an export request is selected
  useEffect(() => {
    if (selectedExportRequest && items.length > 0) {
      fetchExportRequestDetails(selectedExportRequest.exportRequestId.toString());
    }
  }, [selectedExportRequest, items]);


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
    setFormData({ ...formData, exportRequestId: exportRequestId });

    // Fetch the details of the selected export request
    if (selected && items.length > 0) {
      fetchExportRequestDetails(exportRequestId);
    } else {
      setExportRequestDetails([]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate) {
      toast.error("Vui lòng nhập đầy đủ ngày bắt đầu và ngày kết thúc");
      return;
    }

    await createReturnImportRequest(formData);

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
      title: "Mã sản phẩm",
      dataIndex: "itemId",
      key: "itemId",
      width: "25%",
      onHeaderCell: () => ({
        style: { textAlign: "center" as const },
      }),
      render: (id: string) => `${id}`,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "itemName",
      key: "itemName",
      width: "30%",
      ellipsis: true,
      onHeaderCell: () => ({
        style: { textAlign: "center" as const },
      }),
    },
    {
      title: "Số lượng đã xuất",
      dataIndex: "measurementValue",
      key: "measurementValue",
      width: "20%",
      onHeaderCell: () => ({
        style: { textAlign: "center" as const },
      }),
      render: (measurementValue: any, record: any) => (
        <div style={{ textAlign: "center" }}>
          <span style={{ fontWeight: "600", fontSize: "18px" }}>{measurementValue}</span>{" "}
          {record.unitType && (
            <span className="text-gray-500">{record.measurementUnit}</span>
          )}
        </div>
      ),
    }
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
        <>
          <div className="flex gap-6 mt-4">
            <Card title={<span className="text-lg font-semibold">Chọn phiếu xuất mượn / xuất nội bộ</span>} className="w-[25%]">
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
                    showSearch
                  >
                    {filteredExportRequests.map(request => (
                      <Option key={request.exportRequestId} value={request.exportRequestId}>
                        #{request.exportRequestId} - {request.type}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Space>
            </Card>

            <div className="w-[75%]">
              {selectedExportRequest ? (
                <>
                  <Card className="mb-6">
                    <Descriptions title="Thông tin phiếu xuất" bordered>
                      <Descriptions.Item label="Mã phiếu xuất" key="exportRequestId">
                        #{selectedExportRequest.exportRequestId}
                      </Descriptions.Item>
                      <Descriptions.Item label="Loại phiếu xuất" key="exportType">
                        Xuất nội bộ
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày tạo phiếu" key="exportDate">
                        {dayjs(selectedExportRequest.createdDate).format("DD-MM-YYYY")}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày xuất" key="exportDate">
                        {dayjs(selectedExportRequest.exportDate).format("DD-MM-YYYY")}
                      </Descriptions.Item>
                      <Descriptions.Item label="Người nhận hàng" key="receiverName">
                        {selectedExportRequest.receiverName || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="SĐT" key="receiverPhone">
                        {selectedExportRequest.receiverPhone || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Lý do xuất" key="exportReason">
                        {selectedExportRequest.exportReason || "-"}
                      </Descriptions.Item>
                    </Descriptions>
                    <div className="mt-8 mb-2">
                      <label className="text-base font-semibold">Danh sách chi tiết sản phẩm cần nhập lại</label>
                    </div>
                    <Table
                      className="[&_.ant-table-cell]:!p-3"
                      columns={columns}
                      dataSource={exportRequestDetails}
                      rowKey={(record, index) => `${record.itemId}-${record.providerId}-${index}`}
                      loading={exportRequestDetailLoading}
                      pagination={{
                        ...pagination,
                        showTotal: (total: number) => `Tổng ${total} mục`,
                      }}
                      onChange={handleChangePage}
                      locale={{ emptyText: "Không có dữ liệu" }}
                    />
                  </Card>
                </>
              ) : (
                <Card title={<span className="text-lg font-semibold">Thông tin phiếu xuất</span>}>
                  <div className="py-8 text-center text-gray-500">
                    Vui lòng chọn phiếu xuất để xem thông tin chi tiết
                  </div>
                </Card>
              )}
            </div>
          </div>
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
        </>
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
                disabled={!isFormDataValid()}
              >
                Xác nhận thông tin
              </Button>
            </Space>
          </Card>
          <div className="w-7/10">
            <Card title={<span className="text-lg font-semibold">Danh sách hàng hóa sẽ nhập trả từ phiếu xuất #{selectedExportRequest?.exportRequestId}</span>}>
              <Table
                className="[&_.ant-table-cell]:!p-3"
                columns={columns}
                dataSource={exportRequestDetails}
                rowKey={(record, index) => `${record.itemId}-${record.providerId}-${index}`}
                loading={exportRequestDetailLoading}
                pagination={{
                  ...pagination,
                  showTotal: (total: number) => `Tổng ${total} mục`,
                }}
                onChange={handleChangePage}
                locale={{ emptyText: "Không có dữ liệu" }}
              />
            </Card>
          </div>
        </div>
      )}

      <ImportRequestConfirmModal
        open={showConfirmModal}
        onOk={handleSubmit}
        onCancel={() => setShowConfirmModal(false)}
        confirmLoading={loading}
        formData={{
          ...formData,
          exportRequestId: formData.exportRequestId
        }}
        details={exportRequestDetails}
        providers={[]}
      />
    </>
  );
};

export default ImportRequestReturnType;