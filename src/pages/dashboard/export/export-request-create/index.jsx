import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Button, Card, Alert, Modal, Steps } from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { InfoCircleFilled } from "@ant-design/icons";

// Constants
import { ROUTES } from "@/constants/routes";
// Components
import ExcelDataTable from "@/components/export-flow/export-create/ExcelDataTable";
import DeparmentModal from "@/components/export-flow/export-create/DeparmentModal";
import FileUploadSection from "@/components/export-flow/export-create/FileUploadSection";
import ExportRequestInfoForm from "@/components/export-flow/export-create/ExportRequestInfoForm";
import ExportRequestHeader from "@/components/export-flow/export-general/ExportRequestHeader";
import Title from "antd/es/typography/Title";
import RequestTypeSelector from "@/components/commons/RequestTypeSelector";
import UseExportFirstStep from "@/components/export-flow/export-create/UseExportFirstStep";
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
  const [providers, setProviders] = useState([]);
  const [excelFormData, setExcelFormData] = useState(null);
  const [returnImportData, setReturnImportData] = useState(null);
  const [removedItemsNotification, setRemovedItemsNotification] = useState({
    visible: false,
    items: [],
  });

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
    createExportRequestReturn,
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
  // UTILITY FUNCTIONS - FIXED VERSION
  // =============================================================================
  function enrichDataWithItemMeta(dataArray, itemsArray) {
    return dataArray.map((row) => {
      const itemMeta =
        itemsArray.find((i) => String(i.id) === String(row.itemId)) || {};

      // Nếu dữ liệu đã có đầy đủ thông tin (như RETURN type), chỉ bổ sung thiếu
      const isFullyMapped = row.itemName && row.unitType;

      if (isFullyMapped) {
        // Chỉ bổ sung những thuộc tính chưa có
        return {
          ...row,
          totalMeasurementValue:
            row.totalMeasurementValue ?? itemMeta.totalMeasurementValue ?? "",
          inventoryQuantity: itemMeta.quantity || 0,
        };
      }

      // Map đầy đủ cho các trường hợp khác
      return {
        ...row,
        itemName: row.itemName || itemMeta.name || "Không xác định",
        totalMeasurementValue:
          row.totalMeasurementValue ?? itemMeta.totalMeasurementValue ?? "",
        measurementUnit:
          (row.measurementUnit || itemMeta.measurementUnit) ?? "",
        unitType: row.unitType || itemMeta.unitType || "",
        measurementValue:
          row.measurementValue || itemMeta.measurementValue || 0,
        // QUAN TRỌNG: Thêm quantity từ kho
        inventoryQuantity: itemMeta.quantity || 0,
        ...(row.providerId && { providerId: row.providerId }),
        ...(row.providerName && { providerName: row.providerName }),
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
    // ✅ XÓA: setExportTypeCache({});
    setExcelFormData(null);
    setPagination({ current: 1, pageSize: 10, total: 0 });
    resetViewedPages(1);
    setReturnImportData(null);
  };

  /**
   * Gộp các sản phẩm có cùng mã hàng và cộng quantity
   */
  function consolidateDuplicateItems(dataArray) {
    const consolidated = {};

    dataArray.forEach((item) => {
      const key = String(item.itemId);

      if (consolidated[key]) {
        // Nếu đã tồn tại, cộng quantity
        consolidated[key].quantity += Number(item.quantity || 0);
      } else {
        // Nếu chưa tồn tại, tạo mới
        consolidated[key] = {
          ...item,
          quantity: Number(item.quantity || 0),
        };
      }
    });

    return Object.values(consolidated);
  }

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
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // ĐỌC EXPORT TYPE TỪ DÒNG ĐẦU CỦA FILE EXCEL
        const detectedExportType = jsonData[0]?.[1]; // Dòng 1, cột B

        // MAPPING CÁC GIÁ TRỊ CÓ THỂ CÓ TRONG EXCEL VỚI CÁC GIÁ TRỊ TRONG HỆ THỐNG
        const exportTypeMapping = {
          SELLING: "SELLING",
          RETURN: "RETURN",
          PRODUCTION: "PRODUCTION",
          BORROWING: "BORROWING",
          LIQUIDATION: "LIQUIDATION",
        };

        let transformedData = [];
        let startRow = 0;
        let finalExportType = formData.exportType;
        let extractedFormData = null; // THÊM BIẾN NÀY ĐỂ LƯU EXCEL FORM DATA

        // Nếu detect được export type từ Excel và nó khác với hiện tại
        if (detectedExportType && exportTypeMapping[detectedExportType]) {
          finalExportType = exportTypeMapping[detectedExportType];

          // Tự động update export type nếu khác với hiện tại
          if (finalExportType !== formData.exportType) {
            setFormData((prev) => ({
              ...prev,
              exportType: finalExportType,
            }));

            toast.info(
              `Đã tự động chuyển sang loại phiếu xuất: ${getExportTypeDisplayName(
                finalExportType
              )}`
            );
          }
        }

        // Xử lý đặc biệt cho SELLING
        if (finalExportType === "SELLING") {
          if (jsonData.length < 10) {
            throw new Error("File Excel không đúng định dạng cho xuất bán");
          }

          // EXTRACT FORM DATA TỪ EXCEL
          extractedFormData = {
            exportReason:
              jsonData[1]?.[1]?.replace?.("{Điền lý do xuất}", "")?.trim() ||
              "",
            receiverName:
              jsonData[2]?.[1]
                ?.replace?.("{Điền tên người nhận}", "")
                ?.trim() || "",
            receiverPhone:
              jsonData[3]?.[1]
                ?.replace?.("{Điền SĐT người nhận}", "")
                ?.trim() || "",
            receiverAddress:
              jsonData[4]?.[1]
                ?.replace?.("{Điền địa chỉ người nhận}", "")
                ?.trim() || "",
          };

          // LƯU EXCEL FORM DATA VÀO STATE
          setExcelFormData(extractedFormData);

          // Update form data với thông tin từ Excel (giữ nguyên như cũ)
          setFormData((prev) => ({
            ...prev,
            exportType: finalExportType,
            exportReason: extractedFormData.exportReason || prev.exportReason,
            receiverName: extractedFormData.receiverName || prev.receiverName,
            receiverPhone:
              extractedFormData.receiverPhone || prev.receiverPhone,
            receiverAddress:
              extractedFormData.receiverAddress || prev.receiverAddress,
          }));

          startRow = 8;
          const headers = jsonData[7];
          const dataRows = jsonData.slice(startRow);

          transformedData = dataRows
            .filter((row) => row && row.length > 0 && row[0])
            .map((row, index) => {
              const itemId = row[0];
              const quantity = row[1];
              const measurementValue = row[2] || "";

              if (!itemId || !quantity) {
                throw new Error(
                  `Dòng ${
                    startRow + index + 1
                  }: Thiếu thông tin Mã hàng hoặc Số lượng`
                );
              }

              // ✅ TÌM ITEM METADATA ĐỂ LẤY ĐẦY ĐỦ THÔNG TIN
              const foundItem = items.content?.find(
                (i) => String(i.id) === String(itemId)
              );

              if (!foundItem) {
                throw new Error(
                  `Dòng ${
                    startRow + index + 1
                  }: Không tìm thấy mặt hàng với mã ${itemId}`
                );
              }

              return {
                itemId: String(itemId).trim(),
                quantity: Number(quantity),
                measurementValue: measurementValue,
                // ✅ THÊM CÁC THUỘC TÍNH TỪ ITEM METADATA
                itemName: foundItem.name,
                unitType: foundItem.unitType,
                measurementUnit: foundItem.measurementUnit || "Không xác định",
                totalMeasurementValue: foundItem.totalMeasurementValue || "",
              };
            });

          // Thay thế phần cuối else cho các loại khác:
        } else {
          // Xử lý như cũ cho các loại xuất khác
          setExcelFormData(null); // Clear excel form data cho các loại khác

          const jsonDataObjects = XLSX.utils.sheet_to_json(ws);

          transformedData = jsonDataObjects.map((item, index) => {
            const itemId = item["itemId"] || item["Mã hàng"];
            const quantity = item["quantity"] || item["Số lượng"];

            if (!itemId || !quantity) {
              throw new Error(
                `Dòng ${index + 1}: Thiếu thông tin Mã hàng hoặc Số lượng`
              );
            }

            if (finalExportType === "RETURN") {
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
                unitType: foundItem.unitType,
                measurementValue: foundItem.measurementValue || 0,
                providerName: foundProvider.name,
              };
            }

            const foundItem = items.content?.find(
              (i) => String(i.id) === String(itemId)
            );

            if (!foundItem) {
              throw new Error(
                `Dòng ${index + 1}: Không tìm thấy mặt hàng với mã ${itemId}`
              );
            }

            return {
              itemId: String(itemId).trim(),
              quantity: Number(quantity),
              measurementValue:
                item["measurementValue"] || item["Quy cách"] || "",
              itemName: foundItem.name,
              unitType: foundItem.unitType,
              measurementUnit: foundItem.measurementUnit || "Không xác định",
              totalMeasurementValue: foundItem.totalMeasurementValue || "",
            };
          });
        }
        transformedData = consolidateDuplicateItems(transformedData);
        setData(transformedData);
        setValidationError("");
      } catch (error) {
        setValidationError(error.message);
        toast.error(error.message);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  // HELPER FUNCTION (giữ nguyên)
  const getExportTypeDisplayName = (exportType) => {
    const displayNames = {
      SELLING: "Xuất bán",
      RETURN: "Xuất trả nhà cung cấp",
      PRODUCTION: "Xuất sản xuất",
      BORROWING: "Xuất mượn",
      LIQUIDATION: "Xuất thanh lý",
    };
    return displayNames[exportType] || exportType;
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleRemoveFile = () => {
    // Reset all file-related states
    setFile(null);
    setFileName("");
    setData([]);
    setValidationError("");
    setFileConfirmed(false);
    setExcelFormData(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Reset pagination and view tracking
    setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
    resetViewedPages(1);
  };

  // =============================================================================
  // EXPORT TYPE HANDLING
  // =============================================================================
  const handleExportTypeChange = (newExportType) => {
    // Clear file-related states
    setFile(null);
    setFileName("");
    setData([]);
    setValidationError("");
    setFileConfirmed(false);
    setExcelFormData(null);
    setReturnImportData(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // ✅ RESET FORM DATA VỀ INITIAL STATE + chỉ set exportType mới
    setFormData({
      ...INITIAL_FORM_DATA,
      exportType: newExportType,
    });

    // Reset pagination and view tracking
    setPagination({ current: 1, pageSize: 10, total: 0 });
    resetViewedPages(1);
  };

  const handleBackToFileStep = () => {
    setFileConfirmed(false);

    // Chỉ restore data cho RETURN type
    if (formData.exportType === "RETURN" && returnImportData?.selectedItems) {
      const transformedData = returnImportData.selectedItems.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        measurementValue: "",
        unitType: item.unitType || "",
        measurementUnit: item.measurementUnit || "",
        totalMeasurementValue: item.totalMeasurementValue || "",
        inventoryQuantity: item.actualQuantity || 0,
        importOrderDetailId: item.importOrderDetailId,
      }));
      setData(transformedData);
    }

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
  const buildReturnPayload = () => {
    let providerId = null;

    // ✅ ƯU TIÊN LẤY providerId TỪ returnImportData
    if (returnImportData && returnImportData.providerId) {
      providerId = returnImportData.providerId;
    } else if (returnImportData && returnImportData.importOrder) {
      providerId = returnImportData.importOrder.providerId || null;
    } else if (Array.isArray(data) && data.length > 0) {
      providerId = data[0].providerId;
    }

    return {
      countingDate: formData.exportDate,
      countingTime: "12:00:00",
      exportDate: formData.exportDate,
      importOrderId: returnImportData?.importOrderId || null, // ✅ THÊM importOrderId
      exportReason: formData.exportReason,
      providerId: providerId, // ✅ providerId từ API
      type: "RETURN",
    };
  };

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
    countingTime: "12:00:00",
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

    if ((!file || data.length === 0) && formData.exportType != "RETURN") {
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

    if (formData.exportType === "RETURN") {
      if (!formData.exportDate || !formData.exportReason) {
        return {
          isValid: false,
          errorMessage: "Vui lòng nhập đầy đủ ngày xuất và lý do xuất trả.",
        };
      }

      // ✅ THÊM validation cho returnImportData
      if (!returnImportData || !returnImportData.importOrderId) {
        return {
          isValid: false,
          errorMessage: "Vui lòng chọn đơn nhập để tạo phiếu xuất trả.",
        };
      }

      // ✅ THÊM validation cho providerId
      if (!returnImportData.providerId) {
        return {
          isValid: false,
          errorMessage:
            "Không tìm thấy thông tin nhà cung cấp. Vui lòng thử lại.",
        };
      }

      // ✅ THÊM validation cho selectedItems
      if (!data || data.length === 0) {
        return {
          isValid: false,
          errorMessage: "Vui lòng chọn ít nhất một mặt hàng để xuất trả.",
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
      case "RETURN":
        payload = buildReturnPayload();
        createdExport = await createExportRequestReturn(payload);
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

      // toast.success("Đã gửi chi tiết phiếu xuất thành công");
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

  // ✅ SỬA: handleReturnImportConfirm function
  const handleReturnImportConfirm = (data) => {
    // ✅ UPDATE returnImportData với đầy đủ thông tin
    setReturnImportData({
      ...data,
      selectedItems: data.selectedItems.map((item) => ({
        ...item,
        importOrderDetailId: item.importOrderDetailId,
      })),
      providerId: data.providerId, // ✅ THÊM providerId từ UseExportFirstStep
      providerInfo: data.providerInfo, // ✅ THÊM providerInfo từ UseExportFirstStep
    });

    const transformedData = data.selectedItems.map((item) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      measurementValue: "",
      unitType: item.unitType || "",
      measurementUnit: item.measurementUnit || "",
      totalMeasurementValue: item.totalMeasurementValue || "",
      inventoryQuantity: item.actualQuantity || 0,
      importOrderDetailId: item.importOrderDetailId,
    }));

    setData(transformedData);
    setFileConfirmed(true);
  };

  // Thêm function xử lý notification
  const handleRemovedItemsNotification = (removedItems) => {
    setRemovedItemsNotification({
      visible: true,
      items: removedItems,
    });

    // Tự động đóng sau 15 giây
    setTimeout(() => {
      setRemovedItemsNotification((prev) => ({ ...prev, visible: false }));
    }, 15000);
  };

  return (
    <div className="container mx-auto p-3 pt-0">
      {!fileConfirmed ? (
        <>
          <ExportRequestHeader
            title=""
            onBack={() => navigate(ROUTES.PROTECTED.EXPORT.REQUEST.LIST)}
          />

          <Title level={2}>Tạo phiếu xuất</Title>
          <div className="w-2/3 mx-auto">
            <Steps
              className="!mb-4"
              current={0}
              onChange={(clickedStep) => {
                // Chỉ cho phép chuyển sang step 1 nếu đủ điều kiện
                if (
                  clickedStep === 1 &&
                  data.length > 0 &&
                  !validationError &&
                  !hasTableError &&
                  allPagesViewed
                ) {
                  setFileConfirmed(true);
                }
              }}
              items={[
                {
                  title: (
                    <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                      Tải lên file Excel
                    </span>
                  ),
                },
                {
                  title: (
                    <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                      Xác nhận thông tin
                    </span>
                  ),
                  disabled:
                    data.length === 0 ||
                    !!validationError ||
                    hasTableError ||
                    !allPagesViewed,
                },
              ]}
            />
          </div>
          <RequestTypeSelector
            requestType={formData.exportType}
            setRequestType={handleExportTypeChange}
            mode="export"
          />

          {["PRODUCTION", "BORROWING", "LIQUIDATION", "SELLING"].includes(
            formData.exportType
          ) ? (
            <>
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
                    onRemovedItemsNotification={handleRemovedItemsNotification}
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
            <UseExportFirstStep
              onConfirm={handleReturnImportConfirm}
              initialSelectedOrder={returnImportData?.importOrder || null}
              initialSelectedItems={returnImportData?.selectedItems || []}
            />
          )}
        </>
      ) : (
        // Form Input Step
        <>
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
            exportType={formData.exportType}
            items={items.content || []}
            providers={providers}
            pagination={pagination}
            excelFormData={excelFormData}
            returnProviders={
              returnImportData?.providerInfo
                ? [returnImportData.providerInfo]
                : []
            }
            allPagesViewed={allPagesViewed}
            hasTableError={hasTableError}
          />
        </>
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
      {/* Modal thông báo sản phẩm bị xóa */}
      <Modal
        title={
          <div style={{ color: "#d32029", fontWeight: "bold" }}>
            <InfoCircleFilled style={{ marginRight: 8 }} />
            Thông báo sản phẩm không thể xuất
          </div>
        }
        open={removedItemsNotification.visible}
        onOk={() =>
          setRemovedItemsNotification((prev) => ({ ...prev, visible: false }))
        }
        onCancel={() =>
          setRemovedItemsNotification((prev) => ({ ...prev, visible: false }))
        }
        okText="OK"
        cancelButtonProps={{ style: { display: "none" } }}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "black", fontWeight: "bold", marginBottom: 8 }}>
            Tổng cộng có{" "}
            <span style={{ color: "red" }}>
              {removedItemsNotification.items.length}
            </span>{" "}
            sản phẩm không xuất được (tồn kho bằng hoặc dưới mức khả dụng):
          </div>
          <div
            style={{
              color: "#d32029",
              fontSize: "14px",
              maxHeight: 200,
              overflowY: "auto",
              border: "1px solid #ffccc7",
              padding: 12,
              borderRadius: 4,
              backgroundColor: "#ffffe0",
            }}
          >
            {removedItemsNotification.items.map((item, index) => (
              <div key={`${item.itemId}-${index}`} style={{ marginBottom: 4 }}>
                • {item.itemId} - Đã yêu cầu: {item.requestedQuantity}{" "}
                {item.unitType}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: "14px",
              fontStyle: "italic",
              color: "red", // hoặc "#ff4d4f" để đồng bộ với Ant Design
              fontWeight: "600", // hoặc "bold"
            }}
          >
            Các sản phẩm này đã được tự động loại bỏ khỏi danh sách xuất kho
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExportRequestCreate;
