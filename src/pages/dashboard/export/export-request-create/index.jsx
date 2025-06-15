import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Button, Card, Alert } from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import moment from "moment";

// Constants
import { ROUTES } from "@/constants/routes";
// Components
import ExcelDataTable from "@/components/export-flow/export-create/ExcelDataTable";
import ExportTypeSelector from "@/components/export-flow/export-create/ExportTypeSelector";
import DeparmentModal from "@/components/export-flow/export-create/DeparmentModal";
import FileUploadSection from "@/components/export-flow/export-create/FileUploadSection";
import ExportRequestInfoForm from "@/components/export-flow/export-create/ExportRequestInfoForm";
import ExportRequestHeader from "@/components/export-flow/export-general/ExportRequestHeader";
import Title from "antd/es/typography/Title";
// Services
import useItemService from "@/services/useItemService";
import useExportRequestService from "@/services/useExportRequestService";
import useExportRequestDetailService from "@/services/useExportRequestDetailService";
import useDepartmentService from "@/services/useDepartmentService";
import useProviderService from "@/services/useProviderService";
// Hooks
import { usePaginationViewTracker } from "@/hooks/usePaginationViewTracker";

// Initial form data state
const INITIAL_FORM_DATA = {
  exportType: "SELLING",
  exportDate: null,
  exportTime: null,
  exportReason: "",
  note: "",
  // Production fields
  receivingDepartment: null,
  departmentRepresentative: "",
  departmentRepresentativePhone: "",
  // Loan fields
  loanType: "INTERNAL",
  borrowerName: "",
  borrowerPhone: "",
  borrowerAddress: "",
  returnDate: "",
  loanReason: "",
  // Selling fields
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
};

const ExportRequestCreate = () => {
  // Navigation
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // FILE UPLOAD & DATA STATES
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [fileConfirmed, setFileConfirmed] = useState(false);
  const [hasTableError, setHasTableError] = useState(false);
  const [exportTypeCache, setExportTypeCache] = useState({});
  const [providers, setProviders] = useState([]);

  // FORM DATA STATE
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // PAGINATION STATES
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // DEPARTMENT MODAL STATES
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [departmentPage, setDepartmentPage] = useState(1);
  const [departmentLimit, setDepartmentLimit] = useState(10);
  const [departmentTotal, setDepartmentTotal] = useState(0);

  // SERVICE HOOKS
  const [items, setItems] = useState([]);
  const { loading: itemLoading, getItems } = useItemService();
  const { loading: providerLoading, getAllProviders } = useProviderService();

  const {
    createExportRequestProduction,
    createExportRequestLoan,
    createExportRequestSelling,
  } = useExportRequestService();

  const { createExportRequestDetail } = useExportRequestDetailService();

  const {
    getAllDepartments,
    getDepartmentById,
    departments,
    loading: departmentLoading,
  } = useDepartmentService();

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  const mappedData = React.useMemo(
    () => enrichDataWithItemMeta(data, items.content || []),
    [data, items]
  );

  // Calculate counting date/time (3 hours before export)
  const countingDateTime = moment(
    `${formData.exportDate} ${formData.exportTime}`,
    "YYYY-MM-DD HH:mm:ss"
  ).subtract(3, "hours");

  const countingDate = countingDateTime.format("YYYY-MM-DD");
  const countingTime = countingDateTime.format("HH:mm:ss");

  // =============================================================================
  // PAGINATION VIEW TRACKING
  // =============================================================================
  const { allPagesViewed, markPageAsViewed, resetViewedPages, totalPages } =
    usePaginationViewTracker(
      mappedData.length,
      pagination.pageSize,
      pagination.current
    );

  // =============================================================================
  // EFFECTS
  // =============================================================================
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsData = await getItems();
        setItems(itemsData || []);
      } catch (error) {
        toast.error("Không thể lấy danh sách sản phẩm");
      }
    };
    fetchItems();
  }, []);

  /**
   * Reset pagination when mapped data changes
   */
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      current: 1,
      total: mappedData.length,
    }));
    resetViewedPages(1);
  }, [mappedData.length, resetViewedPages]);

  /**
   * Fetch departments when pagination changes
   */
  useEffect(() => {
    const fetchDepartments = async () => {
      const response = await getAllDepartments(departmentPage, departmentLimit);
      setDepartmentTotal(response?.metaDataDTO?.total || 0);
    };
    fetchDepartments();
  }, [departmentPage, departmentLimit]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providersData = await getAllProviders();
        setProviders(providersData?.content || []);
      } catch (error) {
        toast.error("Không thể lấy danh sách nhà cung cấp");
      }
    };
    fetchProviders();
  }, []);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  function enrichDataWithItemMeta(dataArray, itemsArray) {
    return dataArray.map((row) => {
      const itemMeta =
        itemsArray.find((i) => String(i.id) === String(row.itemId)) || {};
      return {
        ...row,
        itemName: itemMeta.name || "Không xác định",
        totalMeasurementValue: itemMeta.totalMeasurementValue ?? "",
        measurementUnit: itemMeta.measurementUnit ?? "",
      };
    });
  }

  /**
   * Reset all form and file states to initial values
   */
  const resetAllStates = () => {
    setFormData(INITIAL_FORM_DATA);
    setFile(null);
    setFileName("");
    setData([]);
    setValidationError("");
    setFileConfirmed(false);
    setHasTableError(false);
    setExportTypeCache({});
    setPagination({ current: 1, pageSize: 10, total: 0 });
    resetViewedPages(1);
  };

  // =============================================================================
  // FILE HANDLING FUNCTIONS
  // =============================================================================
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setFileName(uploadedFile.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const ab = event.target.result;
        const wb = XLSX.read(ab, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        const transformedData = jsonData.map((item, index) => {
          const itemId = item["itemId"] || item["Mã hàng"];
          const quantity = item["quantity"] || item["Số lượng"];

          if (!itemId || !quantity) {
            throw new Error(
              `Dòng ${index + 1}: Thiếu thông tin Mã hàng hoặc Số lượng`
            );
          }

          if (formData.exportType === "RETURN") {
            const providerId = item["providerId"] || item["Mã Nhà cung cấp"];
            if (!providerId) {
              throw new Error(
                `Dòng ${index + 1}: Thiếu thông tin Nhà cung cấp`
              );
            }

            const foundItem = items.content.find(
              (i) => String(i.id) === String(itemId)
            );
            if (!foundItem) {
              throw new Error(
                `Dòng ${index + 1}: Không tìm thấy mặt hàng với mã ${itemId}`
              );
            }

            const foundProvider = providers.find(
              (p) => p.id === Number(providerId)
            );
            if (!foundProvider) {
              throw new Error(
                `Dòng ${
                  index + 1
                }: Không tìm thấy nhà cung cấp với ID ${providerId}`
              );
            }

            // Validate the provider is actually linked to the item
            if (
              !Array.isArray(foundItem.providerIds) ||
              !foundItem.providerIds.includes(Number(providerId))
            ) {
              throw new Error(
                `Dòng ${
                  index + 1
                }: Nhà cung cấp ID ${providerId} không phải là nhà cung cấp của mặt hàng mã ${itemId}`
              );
            }

            return {
              itemId: String(itemId).trim(),
              quantity: Number(quantity),
              providerId: Number(providerId),
              itemName: foundItem.name,
              measurementUnit: foundItem.measurementUnit || "Không xác định",
              totalMeasurementValue: foundItem.totalMeasurementValue || "",
              providerName: foundProvider.name,
            };
          }

          // Các loại xuất khác (SELLING, PRODUCTION, LOAN)
          return {
            itemId: String(itemId).trim(),
            quantity: Number(quantity),
            measurementValue:
              item["measurementValue"] || item["Quy cách"] || "",
          };
        });

        setData(transformedData);
        setValidationError("");
      } catch (error) {
        setValidationError(error.message);
        toast.error(error.message);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleRemoveFile = () => {
    // Reset all file-related states
    setFile(null);
    setFileName("");
    setData([]);
    setValidationError("");
    setFileConfirmed(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Clear cache for current export type
    setExportTypeCache((prevCache) => ({
      ...prevCache,
      [formData.exportType]: {
        file: null,
        fileName: "",
        data: [],
        validationError: "",
      },
    }));

    // Reset pagination and view tracking
    setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
    resetViewedPages(1);
  };

  // =============================================================================
  // EXPORT TYPE HANDLING
  // =============================================================================
  const handleExportTypeChange = (newExportType) => {
    // Cache current data
    setExportTypeCache((prevCache) => ({
      ...prevCache,
      [formData.exportType]: {
        file,
        fileName,
        data,
        validationError,
      },
    }));

    // Restore cached data for new type or use defaults
    const cached = exportTypeCache[newExportType] || {
      file: null,
      fileName: "",
      data: [],
      validationError: "",
    };

    // Update states
    setFormData((prev) => ({ ...prev, exportType: newExportType }));
    setFile(cached.file);
    setFileName(cached.fileName);
    setData(cached.data);
    setValidationError(cached.validationError);

    // Reset file input if no cached file
    if (!cached.file && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBackToFileStep = () => {
    setFileConfirmed(false);
    setPagination((prev) => ({ ...prev, current: 1 }));
    resetViewedPages(1);
  };

  // =============================================================================
  // PAGINATION HANDLING
  // =============================================================================
  const handleTablePageChange = (paginationObj) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationObj.current,
      pageSize: paginationObj.pageSize || prev.pageSize,
      total: mappedData.length,
    }));
    markPageAsViewed(paginationObj.current);
  };

  // =============================================================================
  // FORM SUBMISSION
  // =============================================================================
  const buildProductionPayload = () => ({
    exportReason: formData.exportReason,
    departmentId: formData.receivingDepartment.id,
    receiverName: formData.departmentRepresentative,
    receiverPhone: formData.departmentRepresentativePhone,
    type: "PRODUCTION",
    exportDate: formData.exportDate,
    countingDate: countingDate,
    countingTime: countingTime,
  });

  const buildLoanPayload = () => {
    const basePayload = {
      exportDate: formData.exportDate,
      exportTime: formData.exportTime,
      expectedReturnDate: formData.returnDate,
      exportReason: formData.loanReason,
      type: "BORROWING",
      countingDate: moment(formData.exportDate, "YYYY-MM-DD")
        .subtract(1, "day")
        .format("YYYY-MM-DD"),
      countingTime: formData.exportTime,
    };

    if (formData.loanType === "INTERNAL") {
      return {
        ...basePayload,
        receiverName: formData.departmentRepresentative,
        receiverPhone: formData.departmentRepresentativePhone,
        departmentId: formData.receivingDepartment.id,
      };
    } else {
      return {
        ...basePayload,
        receiverName: formData.borrowerName,
        receiverPhone: formData.borrowerPhone,
        receiverAddress: formData.borrowerAddress,
      };
    }
  };

  const buildSellingPayload = () => ({
    countingDate: formData.exportDate,
    countingTime: "07:00:00",
    exportDate: formData.exportDate,
    exportReason: formData.exportReason,
    receiverName: formData.receiverName,
    receiverPhone: formData.receiverPhone,
    receiverAddress: formData.receiverAddress,
    type: "SELLING",
  });

  const validateFormData = () => {
    // Common validation
    if (!formData.exportDate) {
      return {
        isValid: false,
        errorMessage: "Vui lòng điền đầy đủ thông tin chung cho phiếu xuất",
      };
    }

    if (!file || data.length === 0) {
      return {
        isValid: false,
        errorMessage: "Vui lòng tải lên file Excel với dữ liệu hợp lệ",
      };
    }

    // Production validation
    if (formData.exportType === "PRODUCTION") {
      if (
        !formData.exportReason ||
        !formData.receivingDepartment ||
        !formData.departmentRepresentative ||
        !formData.departmentRepresentativePhone
      ) {
        return {
          isValid: false,
          errorMessage:
            "Vui lòng điền đầy đủ thông tin cho phiếu xuất Production",
        };
      }
    }

    // Loan validation
    if (formData.exportType === "LOAN") {
      if (!formData.returnDate || !formData.loanReason) {
        return {
          isValid: false,
          errorMessage: "Vui lòng điền đầy đủ thông tin cho phiếu xuất mượn",
        };
      }

      if (
        moment(formData.returnDate, "YYYY-MM-DD").isSameOrBefore(
          moment(),
          "day"
        )
      ) {
        return {
          isValid: false,
          errorMessage: "Ngày trả phải lớn hơn ngày hôm nay",
        };
      }

      if (formData.loanType === "INTERNAL") {
        if (
          !formData.receivingDepartment ||
          !formData.departmentRepresentative ||
          !formData.departmentRepresentativePhone
        ) {
          return {
            isValid: false,
            errorMessage:
              "Vui lòng chọn phòng ban và thông tin đại diện cho phiếu xuất mượn nội bộ",
          };
        }
      } else if (formData.loanType === "EXTERNAL") {
        if (
          !formData.borrowerName ||
          !formData.borrowerPhone ||
          !formData.borrowerAddress
        ) {
          return {
            isValid: false,
            errorMessage:
              "Vui lòng điền đầy đủ thông tin cho phiếu xuất mượn bên ngoài",
          };
        }
      }
    }

    // Selling validation
    if (formData.exportType === "SELLING") {
      if (
        !formData.exportDate ||
        !formData.exportReason ||
        !formData.receiverName ||
        !formData.receiverPhone
      ) {
        return {
          isValid: false,
          errorMessage:
            "Vui lòng nhập đầy đủ các trường bắt buộc cho phiếu xuất bán",
        };
      }
    }

    return { isValid: true, errorMessage: "" };
  };

  const createExportRequest = async (exportType) => {
    let payload;
    let createdExport;

    switch (exportType) {
      case "PRODUCTION":
        payload = buildProductionPayload();
        createdExport = await createExportRequestProduction(payload);
        break;
      case "LOAN":
        payload = buildLoanPayload();
        createdExport = await createExportRequestLoan(payload);
        break;
      case "SELLING":
        payload = buildSellingPayload();
        createdExport = await createExportRequestSelling(payload);
        break;
      default:
        throw new Error("Loại phiếu xuất không hợp lệ");
    }

    return createdExport;
  };

  const createExportDetails = async (exportRequestId) => {
    const exportDetailsPayload = data.map(
      ({ itemId, quantity, measurementValue, inventoryItemId }) => {
        const detail = { itemId, quantity };
        if (measurementValue !== undefined)
          detail.measurementValue = measurementValue;
        if (inventoryItemId !== undefined)
          detail.inventoryItemId = inventoryItemId;
        return detail;
      }
    );

    await createExportRequestDetail(exportDetailsPayload, exportRequestId);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    try {
      // Validate form data
      const validation = validateFormData();
      if (!validation.isValid) {
        toast.error(validation.errorMessage);
        return;
      }

      // Create export request
      const createdExport = await createExportRequest(formData.exportType);
      if (!createdExport) {
        toast.error("Không tạo được phiếu xuất");
        return;
      }

      // Create export request details
      await createExportDetails(createdExport.exportRequestId);

      // Success feedback and navigation
      toast.success("Đã gửi chi tiết phiếu xuất thành công");
      navigate(ROUTES.PROTECTED.EXPORT.REQUEST.LIST);

      // Reset states after successful submission
      resetAllStates();
    } catch (error) {
      toast.error("Lỗi khi gửi chi tiết phiếu xuất");
      console.error("Export submission error:", error);
    }
  };

  const handleDepartmentSelect = async (selectedDepartment) => {
    try {
      const departmentDetail = await getDepartmentById(selectedDepartment.id);
      setFormData({
        ...formData,
        receivingDepartment: selectedDepartment,
        departmentRepresentative:
          departmentDetail.content.departmentResponsible || "",
        departmentRepresentativePhone: departmentDetail.content.phone || "",
      });
      setDepartmentModalVisible(false);
    } catch (error) {
      toast.error("Không thể lấy thông tin chi tiết phòng ban");
    }
  };

  return (
    <div className="container mx-auto p-5">
      {!fileConfirmed ? (
        // File Upload Step
        <>
          <ExportRequestHeader
            title=""
            onBack={() => navigate(ROUTES.PROTECTED.EXPORT.REQUEST.LIST)}
          />

          <div className="flex justify-between items-center mb-2">
            <Title level={3}>Nhập file excel để tạo phiếu xuất</Title>
          </div>

          <ExportTypeSelector
            exportType={formData.exportType}
            setExportType={handleExportTypeChange}
          />

          <FileUploadSection
            fileName={fileName}
            exportType={formData.exportType}
            onTriggerFileInput={triggerFileInput}
            onRemoveFile={handleRemoveFile}
          />

          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />

          {validationError && (
            <Alert
              message="Lỗi dữ liệu"
              description={validationError}
              type="error"
              showIcon
              className="mb-4"
              style={{ marginTop: "10px", marginBottom: "10px" }}
              closable
            />
          )}

          <Card title="Xem trước dữ liệu Excel" className="mb-4">
            {mappedData.length > 0 ? (
              <ExcelDataTable
                data={mappedData}
                items={items.content}
                providers={providers}
                exportType={formData.exportType}
                onDataChange={setData}
                onTableErrorChange={setHasTableError}
                pagination={pagination}
                onPaginationChange={handleTablePageChange}
                setPagination={setPagination}
              />
            ) : (
              <div className="text-center py-10 text-gray-500">
                Vui lòng tải lên file Excel để xem chi tiết hàng hóa
              </div>
            )}
          </Card>

          <div className="flex justify-center mt-4">
            <Button
              type="primary"
              disabled={
                data.length === 0 ||
                !!validationError ||
                hasTableError ||
                !allPagesViewed
              }
              onClick={() => setFileConfirmed(true)}
              className="w-300"
            >
              Tiếp tục nhập thông tin phiếu xuất
              {!allPagesViewed && data.length > 0 && (
                <span style={{ color: "red", marginLeft: 8 }}>
                  (Vui lòng xem tất cả các trang)
                </span>
              )}
            </Button>
          </div>
        </>
      ) : (
        // Form Input Step
        <ExportRequestInfoForm
          formData={formData}
          setFormData={setFormData}
          data={data}
          mappedData={mappedData}
          validationError={validationError}
          handleSubmit={handleSubmit}
          departmentModalVisible={departmentModalVisible}
          setDepartmentModalVisible={setDepartmentModalVisible}
          departments={departments}
          setFileConfirmed={handleBackToFileStep}
          fileName={fileName}
          exportType={formData.exportType} // <--- thêm dòng này
          items={items.content || []} // <--- thêm dòng này
          providers={providers} // <--- thêm dòng này
          pagination={pagination} // <--- thêm dòng này (nếu muốn phân trang trong bảng kết quả)
        />
      )}

      {/* Department Selection Modal */}
      <DeparmentModal
        visible={departmentModalVisible}
        title="Chọn bộ phận/phân xưởng"
        data={departments.map((d) => ({
          ...d,
          name: d.departmentName,
        }))}
        pagination={{
          current: departmentPage,
          pageSize: departmentLimit,
          total: departmentTotal,
          onChange: (page, pageSize) => {
            setDepartmentPage(page);
            setDepartmentLimit(pageSize);
          },
        }}
        onSelect={handleDepartmentSelect}
        onCancel={() => setDepartmentModalVisible(false)}
        loading={departmentLoading}
      />
    </div>
  );
};

export default ExportRequestCreate;
