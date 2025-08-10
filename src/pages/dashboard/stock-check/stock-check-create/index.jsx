import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Button, Card, Alert, Steps } from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Title from "antd/es/typography/Title";

// Constants
import { ROUTES } from "@/constants/routes";
// Components
import ExcelDataTable from "@/components/stock-check-flow/stock-check-create/ExcelDataTable";
import ExcelUploadSection from "@/components/commons/ExcelUploadSection";
import BackNavigationHeader from "@/components/export-flow/export-general/BackNavigationHeader";
import StockCheckRequestInfoForm from "@/components/stock-check-flow/stock-check-create/StockCheckRequestInfoForm";
// Services
import useItemService from "@/services/useItemService";
import useStockCheckService from "@/services/useStockCheckService";
import useStockCheckDetailService from "@/services/useStockCheckDetailService";
// Hooks
import { usePaginationViewTracker } from "@/hooks/usePaginationViewTracker";

// Initial form data state
const INITIAL_FORM_DATA = {
  stockCheckReason: "",
  startDate: null,
  expectedCompletedDate: null,
  note: "",
};

const StockCheckRequestCreate = () => {
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
  const [excelFormData, setExcelFormData] = useState(null);

  // FORM DATA STATE
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // PAGINATION STATES
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // SERVICE HOOKS
  const [items, setItems] = useState([]);
  const { loading: itemLoading, getItems } = useItemService();
  const { createStockCheckRequest } = useStockCheckService();
  const { createStockCheckDetail } = useStockCheckDetailService();

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  const mappedData = React.useMemo(
    () => enrichDataWithItemMeta(data, items.content || []),
    [data, items]
  );

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

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  function enrichDataWithItemMeta(dataArray, itemsArray) {
    return dataArray.map((row) => {
      const itemMeta =
        itemsArray.find((i) => String(i.id) === String(row.itemId)) || {};

      return {
        ...row,
        itemName: row.itemName || itemMeta.name || "Không xác định",
        unitType: row.unitType || itemMeta.unitType || "",
        measurementUnit: row.measurementUnit || itemMeta.measurementUnit || "",
        totalMeasurementValue: itemMeta.totalMeasurementValue || "",
        quantity: itemMeta.quantity || 0,
        numberOfAvailableItems: itemMeta.numberOfAvailableItems || 0,
        numberOfAvailableMeasurementValues:
          itemMeta.numberOfAvailableMeasurementValues || 0,
        inventoryQuantity: itemMeta.quantity || 0,
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
    setExcelFormData(null);
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
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let transformedData = [];
        let extractedFormData = null;

        try {
          if (!jsonData || !Array.isArray(jsonData) || jsonData.length < 10) {
            throw new Error("File không đúng định dạng");
          }

          // Extract form data from Excel
          extractedFormData = {
            stockCheckReason: "",
          };

          // Safely extract form data from B7 (index 6, column 1)
          try {
            const getValue = (row, col) => {
              if (jsonData[row] && jsonData[row][col] != null) {
                return String(jsonData[row][col]).trim();
              }
              return "";
            };

            extractedFormData.stockCheckReason = getValue(6, 1); // B7
          } catch (e) {
            console.warn("Lỗi khi đọc thông tin form từ Excel:", e);
          }

          setExcelFormData(extractedFormData);

          setFormData((prev) => ({
            ...prev,
            stockCheckReason:
              extractedFormData.stockCheckReason || prev.stockCheckReason,
          }));

          // Parse item data starting from B10 (index 9, column 1)
          const startRow = 9; // B10 is at index 9
          let dataRows = [];

          if (jsonData.length > startRow) {
            dataRows = jsonData.slice(startRow);
          }

          const validRows = dataRows.filter((row) => {
            return (
              row &&
              Array.isArray(row) &&
              row.length >= 2 &&
              row[1] != null &&
              String(row[1]).trim() !== "" &&
              String(row[1]).trim() !== "Mã hàng" // Skip header if present
            );
          });

          if (validRows.length === 0) {
            throw new Error("Không có dữ liệu sản phẩm trong file");
          }

          transformedData = validRows.map((row, index) => {
            try {
              const itemId = String(row[1]).trim(); // Column B

              if (!itemId) {
                throw new Error(`Dòng ${startRow + index + 1}: Thiếu mã hàng`);
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
                itemName: foundItem.name,
                unitType: foundItem.unitType,
                measurementUnit: foundItem.measurementUnit || "Không xác định",
                totalMeasurementValue: foundItem.totalMeasurementValue || "",
              };
            } catch (rowError) {
              throw new Error(rowError.message);
            }
          });
        } catch (stockCheckError) {
          if (stockCheckError.message.includes("Không có dữ liệu")) {
            throw new Error("Không có dữ liệu sản phẩm trong file");
          } else if (stockCheckError.message.includes("Dòng")) {
            throw stockCheckError;
          } else {
            throw new Error("File không đúng định dạng");
          }
        }

        // Remove duplicates by keeping unique itemIds
        const uniqueData = [];
        const seenItemIds = new Set();

        transformedData.forEach((item) => {
          if (!seenItemIds.has(item.itemId)) {
            seenItemIds.add(item.itemId);
            uniqueData.push(item);
          }
        });

        setData(uniqueData);
        setValidationError("");
      } catch (error) {
        setValidationError(error.message);
        toast.error(error.message);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

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
  const validateFormData = () => {
    if (!formData.startDate) {
      return {
        isValid: false,
        errorMessage: "Vui lòng chọn ngày bắt đầu kiểm kê",
      };
    }

    if (!formData.expectedCompletedDate) {
      return {
        isValid: false,
        errorMessage: "Vui lòng chọn ngày dự kiến hoàn tất",
      };
    }

    if (!formData.stockCheckReason || formData.stockCheckReason.trim() === "") {
      return {
        isValid: false,
        errorMessage: "Vui lòng nhập lý do kiểm kho",
      };
    }

    if (!file || data.length === 0) {
      return {
        isValid: false,
        errorMessage: "Vui lòng tải lên file Excel với dữ liệu hợp lệ",
      };
    }

    if (!data || data.length === 0) {
      return {
        isValid: false,
        errorMessage: "Vui lòng nhập ít nhất một sản phẩm để kiểm kho",
      };
    }

    return { isValid: true, errorMessage: "" };
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

      // Prepare stock check request data
      const stockCheckRequestData = {
        stockCheckReason: formData.stockCheckReason,
        type: "SPOT_CHECK",
        startDate: formData.startDate,
        expectedCompletedDate: formData.expectedCompletedDate,
        countingDate: formData.expectedCompletedDate, // Same as expected date
        countingTime: "23:59:59", // 12h đêm
        note: formData.note || "",
      };

      // Create stock check request
      const createdStockCheck = await createStockCheckRequest(
        stockCheckRequestData
      );
      if (!createdStockCheck) {
        toast.error("Không tạo được phiếu kiểm kho");
        return;
      }

      // Prepare stock check details data
      const stockCheckDetailsData = data.map((item) => ({
        itemId: item.itemId,
        quantity: item.numberOfAvailableItems || 0,
        measurementValue: item.numberOfAvailableMeasurementValues || 0,
      }));

      // Create stock check details
      await createStockCheckDetail(createdStockCheck.id, stockCheckDetailsData);

      toast.success("Đã tạo phiếu kiểm kho thành công");

      navigate(ROUTES.PROTECTED.STOCK_CHECK.REQUEST.LIST);

      // Reset states after successful submission
      resetAllStates();
    } catch (error) {
      toast.error("Lỗi khi tạo phiếu kiểm kho");
      console.error("Stock check submission error:", error);
    }
  };

  return (
    <div className="container mx-auto p-3 pt-0">
      {!fileConfirmed ? (
        <>
          <BackNavigationHeader
            title=""
            onBack={() => navigate(ROUTES.PROTECTED.STOCK_CHECK.REQUEST.LIST)}
          />

          <Title level={2}>Tạo phiếu kiểm kho</Title>
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

          {/* Excel Upload Section */}
          <ExcelUploadSection
            fileName={fileName}
            type="STOCK_CHECK_REQUEST"
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
              Tiếp tục nhập thông tin phiếu kiểm kho
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
        <>
          <StockCheckRequestInfoForm
            formData={formData}
            setFormData={setFormData}
            data={data}
            mappedData={mappedData}
            validationError={validationError}
            handleSubmit={handleSubmit}
            setFileConfirmed={handleBackToFileStep}
            fileName={fileName}
            items={items.content || []}
            pagination={pagination}
            excelFormData={excelFormData}
            allPagesViewed={allPagesViewed}
            hasTableError={hasTableError}
          />
        </>
      )}
    </div>
  );
};

export default StockCheckRequestCreate;
