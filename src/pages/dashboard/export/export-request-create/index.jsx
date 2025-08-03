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
import ExcelUploadSection from "@/components/commons/ExcelUploadSection";
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
  inspectionDateTime: null,
  // INTERNAL fields
  receivingDepartment: null,
  departmentRepresentative: "",
  departmentRepresentativePhone: "",
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

      const isFullyMapped = row.itemName && row.unitType;

      if (isFullyMapped) {
        return {
          ...row,
          totalMeasurementValue:
            row.totalMeasurementValue ?? itemMeta.totalMeasurementValue ?? "",
          inventoryQuantity: itemMeta.quantity || 0,
        };
      }

      // Base mapping
      const enriched = {
        ...row,
        itemName: row.itemName || itemMeta.name || "Không xác định",
        totalMeasurementValue:
          row.totalMeasurementValue ?? itemMeta.totalMeasurementValue ?? "",
        measurementUnit:
          (row.measurementUnit || itemMeta.measurementUnit) ?? "",
        unitType: row.unitType || itemMeta.unitType || "",
        inventoryQuantity: itemMeta.quantity || 0,
        ...(row.providerId && { providerId: row.providerId }),
        ...(row.providerName && { providerName: row.providerName }),
      };

      // Chỉ thêm measurementValue nếu không có trong row
      if (
        row.measurementValue === undefined &&
        itemMeta.measurementValue !== undefined
      ) {
        enriched.measurementValue = itemMeta.measurementValue;
      }

      return enriched;
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
        if (item.quantity !== undefined) {
          consolidated[key].quantity += Number(item.quantity || 0);
        }

        if (
          item.measurementValue !== undefined &&
          item.measurementValue !== ""
        ) {
          consolidated[key].measurementValue =
            (Number(consolidated[key].measurementValue) || 0) +
            Number(item.measurementValue || 0);
        }
      } else {
        // Tạo mới
        consolidated[key] = {
          ...item,
          ...(item.quantity !== undefined && {
            quantity: Number(item.quantity || 0),
          }),
          ...(item.measurementValue !== undefined && {
            measurementValue: Number(item.measurementValue || 0),
          }),
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
        // ĐỌC EXPORT TYPE TỪ Ô B6 CỦA FILE EXCEL
        const detectedExportType = jsonData[5]?.[1]; // Dòng 6 (index 5), cột B

        // MAPPING TỪ TIẾNG VIỆT SANG MÃ HỆ THỐNG
        const exportTypeMapping = {
          "XUẤT BÁN": "SELLING",
          "XUẤT TRẢ NHÀ CUNG CẤP": "RETURN",
          "XUẤT NỘI BỘ": "INTERNAL",
          "XUẤT THANH LÝ": "LIQUIDATION",
          // Giữ lại mapping cũ để tương thích
          SELLING: "SELLING",
          RETURN: "RETURN",
          INTERNAL: "INTERNAL",
          LIQUIDATION: "LIQUIDATION",
        };

        let transformedData = [];
        let startRow = 0;
        let finalExportType = formData.exportType;
        let extractedFormData = null;

        // Nếu detect được export type từ Excel
        if (detectedExportType) {
          // Chuẩn hóa chuỗi: trim và uppercase
          const normalizedType = String(detectedExportType)
            .trim()
            .toUpperCase();

          // Tìm mapping
          const mappedType = exportTypeMapping[normalizedType];

          if (mappedType) {
            finalExportType = mappedType;

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
          } else {
            // Nếu không tìm thấy mapping, thông báo lỗi
            console.warn(
              `Không nhận diện được loại xuất: "${detectedExportType}"`
            );
          }
        }

        if (finalExportType === "SELLING") {
          try {
            if (!jsonData || !Array.isArray(jsonData) || jsonData.length < 13) {
              throw new Error("File không đúng định dạng");
            }

            const requiredCells = [
              { row: 5, col: 0, name: "Loại xuất" },
              { row: 6, col: 0, name: "Lí do xuất" },
              { row: 7, col: 0, name: "Tên người nhận" },
              { row: 8, col: 0, name: "SĐT người nhận" },
              { row: 9, col: 0, name: "Địa chỉ người nhận" },
            ];

            for (const cell of requiredCells) {
              if (!jsonData[cell.row] || !Array.isArray(jsonData[cell.row])) {
                throw new Error("File không đúng định dạng");
              }
            }

            extractedFormData = {
              exportType: "SELLING",
              exportReason: "",
              receiverName: "",
              receiverPhone: "",
              receiverAddress: "",
            };
            // Safely extract form data
            try {
              const getValue = (row, col) => {
                if (jsonData[row] && jsonData[row][col] != null) {
                  return String(jsonData[row][col]).trim();
                }
                return "";
              };

              extractedFormData.exportReason = getValue(6, 1);
              extractedFormData.receiverName = getValue(7, 1);
              extractedFormData.receiverPhone = getValue(8, 1);
              extractedFormData.receiverAddress = getValue(9, 1);
            } catch (e) {
              console.warn("Lỗi khi đọc thông tin form từ Excel:", e);
            }

            setExcelFormData(extractedFormData);

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

            startRow = 12;
            let dataRows = [];

            if (jsonData.length > startRow) {
              dataRows = jsonData.slice(startRow);
            }

            const validRows = dataRows.filter((row) => {
              return (
                row &&
                Array.isArray(row) &&
                row.length >= 3 &&
                row[1] != null &&
                row[2] != null &&
                String(row[1]).trim() !== "" &&
                String(row[1]).trim() !== "Tên hàng" // Loại bỏ header nếu có
              );
            });

            if (validRows.length === 0) {
              throw new Error("Không có dữ liệu sản phẩm trong file");
            }

            transformedData = validRows.map((row, index) => {
              try {
                const itemId = String(row[1]).trim();
                const quantityStr = String(row[2]).trim();

                if (!itemId) {
                  throw new Error(
                    `Dòng ${startRow + index + 1}: Thiếu mã hàng`
                  );
                }

                const numQuantity = Number(quantityStr);
                if (isNaN(numQuantity) || numQuantity <= 0) {
                  throw new Error(
                    `Dòng ${startRow + index + 1}: Số lượng phải là số dương`
                  );
                }

                const foundItem = items.content?.find(
                  (i) => String(i.id) === itemId
                );

                if (!foundItem) {
                  throw new Error(
                    `Dòng ${
                      startRow + index + 1
                    }: Không tìm thấy mặt hàng với mã ${itemId}`
                  );
                }

                return {
                  itemId: itemId,
                  quantity: numQuantity,
                  itemName: foundItem.name,
                  unitType: foundItem.unitType,
                  measurementUnit:
                    foundItem.measurementUnit || "Không xác định",
                  totalMeasurementValue: foundItem.totalMeasurementValue || "",
                };
              } catch (rowError) {
                throw new Error(rowError.message);
              }
            });
          } catch (sellingError) {
            if (sellingError.message.includes("Không có dữ liệu")) {
              throw new Error("Không có dữ liệu sản phẩm trong file");
            } else if (sellingError.message.includes("Dòng")) {
              throw sellingError;
            } else {
              throw new Error("File không đúng định dạng");
            }
          }
        } else if (finalExportType === "INTERNAL") {
          try {
            // Kiểm tra cấu trúc file
            if (!jsonData || !Array.isArray(jsonData) || jsonData.length < 13) {
              throw new Error("File không đúng định dạng cho xuất nội bộ");
            }

            // EXTRACT FORM DATA TỪ EXCEL - giả sử template mới có cấu trúc tương tự
            extractedFormData = {
              exportType: "INTERNAL",
              exportReason: "",
              departmentId: "",
            };

            // Safely extract form data
            try {
              const getValue = (row, col) => {
                if (jsonData[row] && jsonData[row][col] != null) {
                  return String(jsonData[row][col]).trim();
                }
                return "";
              };

              extractedFormData.exportReason = getValue(6, 1); // Lý do xuất ở B7
              extractedFormData.departmentId = getValue(7, 1); // Mã phòng ban ở B8
            } catch (e) {
              console.warn("Lỗi khi đọc thông tin form từ Excel:", e);
            }

            setExcelFormData(extractedFormData);

            setFormData((prev) => ({
              ...prev,
              exportType: finalExportType,
              exportReason: extractedFormData.exportReason || prev.exportReason,
            }));

            // Đọc dữ liệu sản phẩm - điều chỉnh theo template mới
            startRow = 9; // Giống như SELLING
            let dataRows = [];

            if (jsonData.length > startRow) {
              dataRows = jsonData.slice(startRow);
            }

            const validRows = dataRows.filter((row) => {
              return (
                row &&
                Array.isArray(row) &&
                row.length >= 3 &&
                row[1] != null &&
                row[2] != null &&
                String(row[1]).trim() !== ""
              );
            });

            if (validRows.length === 0) {
              throw new Error("Không có dữ liệu sản phẩm trong file");
            }

            transformedData = validRows.map((row, index) => {
              try {
                const itemId = String(row[1]).trim(); // Cột B
                const measurementValueStr = String(row[2]).trim(); // Cột C

                if (!itemId) {
                  throw new Error(
                    `Dòng ${startRow + index + 1}: Thiếu mã hàng`
                  );
                }

                const numMeasurementValue = Number(measurementValueStr);
                if (isNaN(numMeasurementValue) || numMeasurementValue <= 0) {
                  throw new Error(
                    `Dòng ${
                      startRow + index + 1
                    }: Giá trị đo lường phải là số dương`
                  );
                }

                const foundItem = items.content?.find(
                  (i) => String(i.id) === itemId
                );

                if (!foundItem) {
                  throw new Error(
                    `Dòng ${
                      startRow + index + 1
                    }: Không tìm thấy mặt hàng với mã ${itemId}`
                  );
                }

                return {
                  itemId: itemId,
                  measurementValue: numMeasurementValue,
                  itemName: foundItem.name,
                  unitType: foundItem.unitType,
                  measurementUnit:
                    foundItem.measurementUnit || "Không xác định",
                  totalMeasurementValue: foundItem.totalMeasurementValue || "",
                };
              } catch (rowError) {
                throw new Error(rowError.message);
              }
            });
          } catch (productionError) {
            if (productionError.message.includes("Không có dữ liệu")) {
              throw new Error("Không có dữ liệu sản phẩm trong file");
            } else if (productionError.message.includes("Dòng")) {
              throw productionError;
            } else {
              throw new Error("File không đúng định dạng");
            }
          }
        } else {
          setExcelFormData(null);
          const jsonDataObjects = XLSX.utils.sheet_to_json(ws);

          transformedData = jsonDataObjects.map((item, index) => {
            const itemId = item["itemId"] || item["Mã hàng"];

            if (["LIQUIDATION"].includes(finalExportType)) {
              const measurementValue =
                item["measurementValue"] || item["Giá trị đo lường"];

              if (!itemId || !measurementValue) {
                throw new Error(
                  `Dòng ${
                    index + 1
                  }: Thiếu thông tin Mã hàng hoặc Giá trị đo lường`
                );
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
                measurementValue: Number(measurementValue), // ✅ CHỈ có measurementValue
                itemName: foundItem.name,
                unitType: foundItem.unitType,
                measurementUnit: foundItem.measurementUnit || "Không xác định",
                totalMeasurementValue: foundItem.totalMeasurementValue || "",
              };
            } else {
              // ✅ RETURN và các loại khác dùng quantity
              const quantity = item["quantity"] || item["Số lượng"];

              if (!itemId || !quantity) {
                throw new Error(
                  `Dòng ${index + 1}: Thiếu thông tin Mã hàng hoặc Số lượng`
                );
              }

              // Logic cho RETURN giữ nguyên như cũ...
              if (finalExportType === "RETURN") {
                // Code RETURN logic ở đây...
              }

              // Default case
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
                quantity: Number(quantity), // ✅ CHỈ có quantity
                itemName: foundItem.name,
                unitType: foundItem.unitType,
                measurementUnit: foundItem.measurementUnit || "Không xác định",
                totalMeasurementValue: foundItem.totalMeasurementValue || "",
              };
            }
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

  const getExportTypeDisplayName = (exportType) => {
    const displayNames = {
      SELLING: "Xuất bán",
      RETURN: "Xuất trả nhà cung cấp",
      INTERNAL: "Xuất nội bộ",
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
    // Reset file-related states
    setFile(null);
    setFileName("");
    setData([]);
    setValidationError("");
    setFileConfirmed(false);
    setExcelFormData(null);
    setReturnImportData(null);
    setHasTableError(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setFormData({
      ...INITIAL_FORM_DATA, // Reset tất cả các field về giá trị ban đầu
      exportType: newExportType, // Chỉ giữ lại exportType mới
    });

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

    if (returnImportData && returnImportData.providerId) {
      providerId = returnImportData.providerId;
    } else if (returnImportData && returnImportData.importOrder) {
      providerId = returnImportData.importOrder.providerId || null;
    } else if (Array.isArray(data) && data.length > 0) {
      providerId = data[0].providerId;
    }

    return {
      countingDate: formData.exportDate,
      countingTime: "23:59:59",
      exportDate: formData.exportDate,
      importOrderId: returnImportData?.importOrderId || null,
      exportReason: formData.exportReason,
      providerId: providerId,
      type: "RETURN",
    };
  };

  const buildProductionPayload = () => {
    let countingDate = formData.exportDate;
    let countingTime = "12:00:00";

    // Nếu có inspectionDateTime, cắt chuỗi để lấy ngày và giờ
    if (formData.inspectionDateTime) {
      const [datePart, timePart] = formData.inspectionDateTime.split(" ");
      countingDate = datePart;
      countingTime = timePart;
    }

    return {
      exportReason: formData.exportReason,
      receiverName: formData.departmentRepresentative,
      receiverPhone: formData.departmentRepresentativePhone,
      departmentId: formData.receivingDepartment.id,
      countingDate: countingDate,
      countingTime: countingTime,
      type: "INTERNAL",
      exportDate: formData.exportDate,
    };
  };

  const buildSellingPayload = () => {
    let countingDate = formData.exportDate;
    let countingTime = "12:00:00";

    // Nếu có inspectionDateTime, cắt chuỗi để lấy ngày và giờ
    if (formData.inspectionDateTime) {
      const [datePart, timePart] = formData.inspectionDateTime.split(" ");
      countingDate = datePart;
      countingTime = timePart;
    }

    return {
      countingDate: countingDate,
      countingTime: countingTime,
      exportDate: formData.exportDate,
      exportReason: formData.exportReason,
      receiverName: formData.receiverName,
      receiverPhone: formData.receiverPhone,
      receiverAddress: formData.receiverAddress,
      type: "SELLING",
    };
  };

  const validateFormData = () => {
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

    // INTERNAL validation
    if (formData.exportType === "INTERNAL") {
      if (
        !formData.exportReason ||
        !formData.receivingDepartment ||
        !formData.departmentRepresentative ||
        !formData.departmentRepresentativePhone
      ) {
        return {
          isValid: false,
          errorMessage: "Vui lòng điền đầy đủ thông tin cho phiếu xuất nội bộ",
        };
      }
    }

    // Selling validation
    if (formData.exportType === "SELLING") {
      // Validate thông tin cơ bản
      if (!formData.exportDate) {
        return {
          isValid: false,
          errorMessage: "Vui lòng chọn ngày xuất",
        };
      }

      if (!formData.exportReason || formData.exportReason.trim() === "") {
        return {
          isValid: false,
          errorMessage: "Vui lòng nhập lý do xuất",
        };
      }

      if (!formData.receiverName || formData.receiverName.trim() === "") {
        return {
          isValid: false,
          errorMessage: "Vui lòng nhập tên người nhận",
        };
      }

      if (!formData.receiverPhone || formData.receiverPhone.trim() === "") {
        return {
          isValid: false,
          errorMessage: "Vui lòng nhập số điện thoại người nhận",
        };
      }

      // Validate phone number format (optional)
      const phoneRegex = /^[0-9]{10,11}$/;
      const cleanPhone = formData.receiverPhone.replace(/[^0-9]/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        return {
          isValid: false,
          errorMessage: "Số điện thoại không hợp lệ (10-11 số)",
        };
      }

      // Validate có data sản phẩm
      if (!data || data.length === 0) {
        return {
          isValid: false,
          errorMessage: "Vui lòng nhập ít nhất một sản phẩm để xuất",
        };
      }

      // Validate từng sản phẩm
      for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (!item.itemId) {
          return {
            isValid: false,
            errorMessage: `Sản phẩm dòng ${i + 1}: Thiếu mã hàng`,
          };
        }

        if (!item.quantity || item.quantity <= 0) {
          return {
            isValid: false,
            errorMessage: `Sản phẩm dòng ${i + 1}: Số lượng phải lớn hơn 0`,
          };
        }

        // Kiểm tra tồn kho nếu cần
        if (
          item.inventoryQuantity !== undefined &&
          item.quantity > item.inventoryQuantity
        ) {
          return {
            isValid: false,
            errorMessage: `Sản phẩm ${item.itemId}: Số lượng xuất (${item.quantity}) vượt quá tồn kho (${item.inventoryQuantity})`,
          };
        }
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
      case "INTERNAL":
        payload = buildProductionPayload();
        createdExport = await createExportRequestProduction(payload);
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
    const exportDetailsPayload = data.map((item) => {
      const { itemId, quantity, measurementValue, inventoryItemId } = item;

      const detail = { itemId };

      // Logic cho từng loại export type
      if (
        formData.exportType === "SELLING" ||
        formData.exportType === "RETURN"
      ) {
        // Chỉ thêm quantity nếu có (SELLING, RETURN)
        if (quantity !== undefined) {
          detail.quantity = quantity;
        }
      } else if (
        formData.exportType === "INTERNAL" ||
        formData.exportType === "LIQUIDATION"
      ) {
        // Chỉ thêm measurementValue nếu có (INTERNAL, LIQUIDATION)
        if (measurementValue !== undefined) {
          detail.measurementValue = measurementValue;
        }
      }

      if (inventoryItemId !== undefined) {
        detail.inventoryItemId = inventoryItemId;
      }

      return detail;
    });

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

  const handleReturnImportConfirm = (data) => {
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
    // Đảm bảo mỗi item có đủ thông tin measurementUnit
    const enrichedItems = removedItems.map((item) => ({
      ...item,
      measurementUnit:
        item.measurementUnit ||
        items.content?.find((i) => String(i.id) === String(item.itemId))
          ?.measurementUnit ||
        "",
    }));

    setRemovedItemsNotification({
      visible: true,
      items: enrichedItems,
    });

    // Tự động đóng sau 2 phút 30 giây
    setTimeout(() => {
      setRemovedItemsNotification((prev) => ({ ...prev, visible: false }));
    }, 150000);
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
                      {formData.exportType === "RETURN"
                        ? "Chọn đơn nhập"
                        : "Tải lên file Excel"}
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

          {["INTERNAL", "LIQUIDATION", "SELLING"].includes(
            formData.exportType
          ) ? (
            <>
              <ExcelUploadSection
                fileName={fileName}
                type={formData.exportType}
                onFileChange={handleFileUpload}
                onRemoveFile={handleRemoveFile}
                fileInputRef={fileInputRef}
                buttonLabel="Tải lên file Excel"
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
            sản phẩm không xuất được (không đủ tồn kho khả dụng):
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
                {formData.exportType === "SELLING"
                  ? item.unitType
                  : item.measurementUnit}
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
