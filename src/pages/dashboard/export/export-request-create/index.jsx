import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Button, Card, Alert, Space } from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import moment from "moment";
import FileUploadSection from "@/components/export-flow/FileUploadSection";
import ExcelDataTable from "@/components/export-flow/ExcelDataTable";
import SelectModal from "@/components/export-flow/SelectModal";
import useItemService from "@/hooks/useItemService";
import useExportRequestService from "@/hooks/useExportRequestService";
import useExportRequestDetailService from "@/hooks/useExportRequestDetailService";
import ExportRequestInfoForm from "@/components/export-flow/ExportRequestInfoForm";
import ExportRequestHeader from "@/components/export-flow/ExportRequestHeader";
import ExportTypeSelector from "@/components/export-flow/ExportTypeSelector";
import Title from "antd/es/typography/Title";
import { usePaginationViewTracker } from "@/hooks/usePaginationViewTracker";

const ExportRequestCreate = () => {
  // --- State cho file upload và kiểm tra dữ liệu ---
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [fileConfirmed, setFileConfirmed] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [hasTableError, setHasTableError] = useState(false);

  // --- Lấy danh sách sản phẩm ---
  const [items, setItems] = useState([]);
  const { loading: itemLoading, getItems } = useItemService();

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

  // enrichDataWithItemMeta KHÔNG cần khai báo trước, khai báo ngay trên chỗ mappedData luôn cũng được!
  const mappedData = React.useMemo(
    () => enrichDataWithItemMeta(data, items.content || []),
    [data, items]
  );

  // --- Pagination state ---
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // --- Cập nhật pagination khi mappedData thay đổi ---
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      current: 1,
      total: mappedData.length,
    }));
    resetViewedPages(1);
    // eslint-disable-next-line
  }, [mappedData.length]); // mappedData.length thay đổi thì reset lại

  // --- Hook tracking xem hết trang chưa ---
  const { allPagesViewed, markPageAsViewed, resetViewedPages, totalPages } =
    usePaginationViewTracker(
      mappedData.length,
      pagination.pageSize,
      pagination.current
    );

  // --- State cho dữ liệu form ---
  const [formData, setFormData] = useState({
    exportType: "PRODUCTION", // hoặc "LOAN"
    exportDate: null,
    exportTime: null,
    exportReason: "",
    note: "",
    // Dành cho Production:
    receivingDepartment: null,
    departmentRepresentative: "",
    departmentRepresentativePhone: "",
    // Dành cho LOAN:
    loanType: "INTERNAL",
    borrowerName: "",
    borrowerPhone: "",
    borrowerAddress: "",
    returnDate: "",
    loanReason: "",
  });

  // --- Dữ liệu mẫu và state hiển thị modal cho danh sách phòng ban ---
  const departments = [
    { id: 1, name: "Bộ phận A" },
    { id: 2, name: "Phân xưởng B" },
    { id: 3, name: "Bộ phận C" },
  ];
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);

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

  // --- Fake API: Lấy chi tiết phòng ban (dành cho Production) ---
  const fakeFetchDepartmentDetails = (department) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const details = {
          1: { receiverName: "Người đại diện A", receiverPhone: "0123456789" },
          2: { receiverName: "Người đại diện B", receiverPhone: "0987654321" },
          3: { receiverName: "Người đại diện C", receiverPhone: "0912345678" },
        };
        resolve(details[department.id]);
      }, 500);
    });
  };

  // --- Các hàm xử lý file Excel ---

  const downloadTemplate = () => {
    const template = [
      {
        itemId: "Mã hàng (số)",
        quantity: "Số lượng (số)",
        measurementValue: "Quy cách",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "export_request_template.xlsx");
  };

  // Khi quay lại từ form nhập thông tin phiếu xuất
  const handleBackToFileStep = () => {
    setFileConfirmed(false);
    setPagination((prev) => ({ ...prev, current: 1 })); // Về trang 1
    resetViewedPages(1); // Reset lại page đã đọc!
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const ab = event.target.result;
        const wb = XLSX.read(ab, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        try {
          const transformedData = jsonData.map((item, index) => {
            const itemId = item["itemId"] || item["Mã hàng"];
            const quantity = item["quantity"] || item["Số lượng"];
            const measurementValue =
              item["measurementValue"] || item["Quy cách"] || "";
            if (!itemId || !quantity) {
              throw new Error(
                `Dòng ${index + 1}: Thiếu thông tin itemId hoặc quantity`
              );
            }
            return {
              itemId: String(itemId).trim(),
              quantity: Number(quantity),
              measurementValue: measurementValue.toString(),
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
    }
  };

  const triggerFileInput = () => fileInputRef.current.click();

  // --- API hooks cho phiếu xuất ---
  const { createExportRequestProduction, createExportRequestLoan } =
    useExportRequestService();
  const { createExportRequestDetail } = useExportRequestDetailService();

  const countingDateTime = moment(
    `${formData.exportDate} ${formData.exportTime}`,
    "YYYY-MM-DD HH:mm:ss"
  ).subtract(4, "hours");

  const countingDate = countingDateTime.format("YYYY-MM-DD");
  const countingTime = countingDateTime.format("HH:mm:ss");

  // --- Hàm xử lý submit ---
  const handleSubmit = async () => {
    if (!formData.exportDate || !formData.exportTime) {
      toast.error("Vui lòng điền đầy đủ thông tin chung cho phiếu xuất");
      return;
    }
    if (!file || data.length === 0) {
      toast.error("Vui lòng tải lên file Excel với dữ liệu hợp lệ");
      return;
    }

    let payload = {};
    let createdExport;

    if (formData.exportType === "PRODUCTION") {
      if (
        !formData.exportReason ||
        !formData.receivingDepartment ||
        !formData.departmentRepresentative ||
        !formData.departmentRepresentativePhone
      ) {
        toast.error("Vui lòng điền đầy đủ thông tin cho phiếu xuất Production");
        return;
      }
      payload = {
        exportReason: formData.exportReason,
        departmentId: formData.receivingDepartment.id,
        receiverName: formData.departmentRepresentative,
        receiverPhone: formData.departmentRepresentativePhone,
        type: "PRODUCTION",
        exportDate: formData.exportDate,
        exportTime: formData.exportTime,
        countingDate: countingDate,
        countingTime: countingTime,
      };
      createdExport = await createExportRequestProduction(payload);
    } else if (formData.exportType === "LOAN") {
      if (!formData.returnDate || !formData.loanReason) {
        toast.error("Vui lòng điền đầy đủ thông tin cho phiếu xuất mượn");
        return;
      }
      if (
        moment(formData.returnDate, "YYYY-MM-DD").isSameOrBefore(
          moment(),
          "day"
        )
      ) {
        toast.error("Ngày trả phải lớn hơn ngày hôm nay");
        return;
      }
      if (formData.loanType === "INTERNAL") {
        if (
          !formData.receivingDepartment ||
          !formData.departmentRepresentative ||
          !formData.departmentRepresentativePhone
        ) {
          toast.error(
            "Vui lòng chọn phòng ban và thông tin đại diện cho phiếu xuất mượn nội bộ"
          );
          return;
        }
        payload = {
          exportDate: formData.exportDate,
          exportTime: formData.exportTime,
          receiverName: formData.departmentRepresentative,
          receiverPhone: formData.departmentRepresentativePhone,
          departmentId: formData.receivingDepartment.id,
          expectedReturnDate: formData.returnDate,
          exportReason: formData.loanReason,
          type: "BORROWING",
          countingDate: moment(formData.exportDate, "YYYY-MM-DD")
            .subtract(1, "day")
            .format("YYYY-MM-DD"),
          countingTime: formData.exportTime,
        };
      } else if (formData.loanType === "EXTERNAL") {
        if (
          !formData.borrowerName ||
          !formData.borrowerPhone ||
          !formData.borrowerAddress
        ) {
          toast.error(
            "Vui lòng điền đầy đủ thông tin cho phiếu xuất mượn bên ngoài"
          );
          return;
        }
        payload = {
          exportDate: formData.exportDate,
          exportTime: formData.exportTime,
          receiverName: formData.borrowerName,
          receiverPhone: formData.borrowerPhone,
          receiverAddress: formData.borrowerAddress,
          expectedReturnDate: formData.returnDate,
          exportReason: formData.loanReason,
          type: "BORROWING",
          countingDate: moment(formData.exportDate, "YYYY-MM-DD")
            .subtract(1, "day")
            .format("YYYY-MM-DD"),
          countingTime: formData.exportTime,
        };
      }
      createdExport = await createExportRequestLoan(payload);
    } else {
      toast.error("Loại phiếu xuất không hợp lệ");
      return;
    }

    if (!createdExport) {
      toast.error("Không tạo được phiếu xuất");
      return;
    }
    navigate(ROUTES.PROTECTED.EXPORT.REQUEST.LIST);

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

    try {
      await createExportRequestDetail(
        exportDetailsPayload,
        createdExport.exportRequestId
      );
      toast.success("Đã gửi chi tiết phiếu xuất thành công");
      navigate(ROUTES.PROTECTED.EXPORT.REQUEST.LIST);
    } catch (error) {
      toast.error("Lỗi khi gửi chi tiết phiếu xuất");
    }

    // Reset lại trạng thái sau khi submit
    setFormData({
      exportType: "PRODUCTION",
      exportDate: null,
      exportTime: null,
      exportReason: "",
      note: "",
      receivingDepartment: null,
      departmentRepresentative: "",
      departmentRepresentativePhone: "",
      loanType: "INTERNAL",
      borrowerName: "",
      borrowerPhone: "",
      borrowerAddress: "",
      returnDate: "",
      loanReason: "",
    });
    setFile(null);
    setFileName("");
    setData([]);
  };

  // Table AntD gọi hàm này khi đổi trang hoặc pageSize
  const handleTablePageChange = (paginationObj) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationObj.current,
      pageSize: paginationObj.pageSize || prev.pageSize,
      total: mappedData.length,
    }));
    markPageAsViewed(paginationObj.current);
  };

  return (
    <div className="container mx-auto p-5">
      {!fileConfirmed ? (
        <>
          <ExportRequestHeader
            title=""
            onBack={() => navigate(ROUTES.PROTECTED.EXPORT.REQUEST.LIST)}
          />

          <div className="flex justify-between items-center mb-4">
            <Title level={2}>Nhập file excel để tạo phiếu xuất</Title>

            <Space>
              <FileUploadSection
                fileName={fileName}
                onDownloadTemplate={downloadTemplate}
                onTriggerFileInput={triggerFileInput}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </Space>
          </div>

          <ExportTypeSelector
            exportType={formData.exportType}
            setExportType={(value) =>
              setFormData({ ...formData, exportType: value })
            }
          />

          {validationError && (
            <Alert
              message="Lỗi dữ liệu"
              description={validationError}
              type="error"
              showIcon
              className="mb-4"
              closable
            />
          )}

          <Card title="Xem trước dữ liệu Excel" className="mb-4">
            {mappedData.length > 0 ? (
              // <ExcelDataTable
              //   data={mappedData}
              //   items={items.content}
              //   onDataChange={(updatedData) => {
              //     setData(enrichDataWithItemMeta(updatedData, items.content));
              //   }}
              //   onTableErrorChange={setHasTableError}
              //   pagination={pagination}
              //   onPaginationChange={handleTablePageChange}
              // />
              <ExcelDataTable
                data={mappedData} // mappedData chỉ dùng để render
                items={items.content}
                onDataChange={(updatedData) => {
                  // Chỉ lấy các trường cần thiết cho raw data
                  setData(
                    updatedData.map(
                      ({
                        itemId,
                        quantity,
                        measurementValue,
                        inventoryItemId,
                      }) => ({
                        itemId,
                        quantity,
                        measurementValue,
                        inventoryItemId,
                      })
                    )
                  );
                }}
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

          <Button
            type="primary"
            disabled={
              data.length === 0 ||
              !!validationError ||
              hasTableError ||
              !allPagesViewed
            }
            onClick={() => setFileConfirmed(true)}
            className="w-full"
          >
            Tiếp tục nhập thông tin phiếu xuất
            {!allPagesViewed && data.length > 0 && (
              <span style={{ color: "red", marginLeft: 8 }}>
                (Vui lòng xem tất cả các trang)
              </span>
            )}
          </Button>
        </>
      ) : (
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
          fakeFetchDepartmentDetails={fakeFetchDepartmentDetails}
          //helper
          //setFileConfirmed={setFileConfirmed}
          setFileConfirmed={handleBackToFileStep}
          fileName={fileName}
        />
      )}

      {/* Modal chọn phòng ban */}
      <SelectModal
        visible={departmentModalVisible}
        title="Chọn bộ phận/phân xưởng"
        data={departments}
        onSelect={async (selectedDepartment) => {
          const details = await fakeFetchDepartmentDetails(selectedDepartment);
          setFormData({
            ...formData,
            receivingDepartment: selectedDepartment,
            departmentRepresentative: details?.receiverName || "",
            departmentRepresentativePhone: details?.receiverPhone || "",
          });
          setDepartmentModalVisible(false);
        }}
        onCancel={() => setDepartmentModalVisible(false)}
      />
    </div>
  );
};

export default ExportRequestCreate;
