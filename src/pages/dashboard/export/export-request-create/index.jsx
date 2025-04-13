import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  Typography,
  Space,
  Card,
  Alert,
  Select,
  Input,
  Modal,
} from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import moment from "moment";
import {
  UploadOutlined,
  DownloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import FileUploadSection from "@/components/export-flow/FileUploadSection";
import UseExportForm from "@/components/export-flow/UseExportForm";
import LoanExportForm from "@/components/export-flow/LoanExportForm";
import ExcelDataTable from "@/components/export-flow/ExcelDataTable";
import SelectModal from "@/components/export-flow/SelectModal";
import useItemService from "@/hooks/useItemService";
import useExportRequestService from "@/hooks/useExportRequestService";
import useExportRequestDetailService from "@/hooks/useExportRequestDetailService";
import { useSelector } from "react-redux";

const { Title } = Typography;
const { Option } = Select;

const ExportRequestCreate = () => {
  // --- State cho file upload và kiểm tra dữ liệu ---
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [validationError, setValidationError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // --- Lấy danh sách sản phẩm ---
  const [items, setItems] = useState([]);
  const { loading: itemLoading, getItems } = useItemService();
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsData = await getItems();
        console.log("Items:", itemsData);
        setItems(itemsData || []);
      } catch (error) {
        console.error("Error fetching items:", error);
        toast.error("Không thể lấy danh sách sản phẩm");
      }
    };
    fetchItems();
  }, []);

  // --- State cho dữ liệu form ---
  // Dữ liệu form được thiết kế theo giao diện của UseExportForm và LoanExportForm
  const [formData, setFormData] = useState({
    exportType: "PRODUCTION", // hoặc "LOAN"
    exportDate: moment().format("YYYY-MM-DD"),
    exportTime: moment().format("HH:mm:ss"),
    exportReason: "",
    note: "",
    // Dành cho Production:
    receivingDepartment: null, // đối ứng với departmentId
    departmentRepresentative: "", // đối ứng với receiverName (nội bộ)
    departmentRepresentativePhone: "", // đối ứng với receiverPhone (nội bộ)
    // Dành cho LOAN:
    loanType: "INTERNAL", // "INTERNAL" hoặc "EXTERNAL"
    borrowerName: "",
    borrowerPhone: "",
    borrowerAddress: "",
    returnDate: "", // expectedReturnDate
    loanReason: "",
  });

  // --- Dữ liệu mẫu và state hiển thị modal cho danh sách phòng ban ---
  const departments = [
    { id: 1, name: "Bộ phận A" },
    { id: 2, name: "Phân xưởng B" },
    { id: 3, name: "Bộ phận C" },
  ];
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);

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

  // Khi tải template, bao gồm 3 cột: itemId, quantity, measurementValue (Quy cách)
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

  // Khi upload file, map dữ liệu Excel để trích xuất cột measurementValue (hoặc "Quy cách")
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
              itemId: Number(itemId),
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

  // --- Hàm xử lý submit ---
  const handleSubmit = async () => {
    // Kiểm tra thông tin chung
    if (!formData.exportDate || !formData.exportTime) {
      toast.error("Vui lòng điền đầy đủ thông tin chung cho phiếu xuất");
      return;
    }
    // Kiểm tra file và dữ liệu Excel
    if (!file || data.length === 0) {
      toast.error("Vui lòng tải lên file Excel với dữ liệu hợp lệ");
      return;
    }

    let payload = {};
    let createdExport;

    if (formData.exportType === "PRODUCTION") {
      // Validate các trường bắt buộc cho Production
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
      };
      createdExport = await createExportRequestProduction(payload);
    } else if (formData.exportType === "LOAN") {
      // Cập nhật payload với type là "BORROWING"
      if (!formData.returnDate || !formData.loanReason) {
        toast.error("Vui lòng điền đầy đủ thông tin cho phiếu xuất mượn");
        return;
      }
      // Kiểm tra ngày trả phải lớn hơn ngày hiện tại
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

    // Upload file Excel làm chi tiết phiếu xuất
    const fd = new FormData();
    fd.append("file", file);
    await createExportRequestDetail(fd, createdExport.exportRequestId);

    navigate(ROUTES.PROTECTED.EXPORT.REQUEST.LIST);

    // Reset lại trạng thái sau khi submit
    setFormData({
      exportType: "PRODUCTION",
      exportDate: moment().format("YYYY-MM-DD"),
      exportTime: moment().format("HH:mm:ss"),
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

  // --- Mapping dữ liệu Excel để hiển thị ---
  // Thêm cột measurementValue vào mappedData
  const mappedData = data.map((row) => {
    const foundItem = items.content.find((i) => i.id === row.itemId);
    return {
      ...row,
      itemName: foundItem ? foundItem.name : "Không xác định",
      measurementValue: row.measurementValue,
    };
  });

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Tạo phiếu xuất</Title>
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

      <div className="mb-4">
        <Space direction="horizontal">
          <span className="font-semibold">Loại phiếu xuất: </span>
          <Select
            value={formData.exportType}
            onChange={(value) =>
              setFormData({ ...formData, exportType: value })
            }
            style={{ width: 300 }}
          >
            <Option value="PRODUCTION">Xuất sản xuất</Option>
            <Option value="LOAN">Xuất mượn</Option>
          </Select>
        </Space>
      </div>

      <div className="flex gap-6">
        <Card title="Thông tin phiếu xuất" className="w-1/3">
          <Space direction="vertical" className="w-full">
            {formData.exportType === "PRODUCTION" && (
              <UseExportForm
                formData={formData}
                setFormData={setFormData}
                openDepartmentModal={() => setDepartmentModalVisible(true)}
              />
            )}
            {formData.exportType === "LOAN" && (
              <LoanExportForm
                formData={formData}
                setFormData={setFormData}
                openDepartmentModal={() => setDepartmentModalVisible(true)}
              />
            )}
            <Button
              type="primary"
              onClick={handleSubmit}
              className="w-full mt-4"
              disabled={data.length === 0 || !!validationError}
            >
              Xác nhận tạo phiếu xuất
            </Button>
          </Space>
        </Card>

        <div className="w-2/3">
          <Card title="Chi tiết hàng hóa từ file Excel">
            {mappedData.length > 0 ? (
              <ExcelDataTable data={mappedData} />
            ) : (
              <div className="text-center py-10 text-gray-500">
                Vui lòng tải lên file Excel để xem chi tiết hàng hóa
              </div>
            )}
          </Card>
        </div>
      </div>

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

// import React, { useState, useEffect, useRef } from "react";
// import * as XLSX from "xlsx";
// import {
//   Button,
//   Typography,
//   Space,
//   Card,
//   Alert,
//   Select,
//   Input,
//   Modal,
// } from "antd";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";
// import { ROUTES } from "@/constants/routes";
// import moment from "moment";
// import {
//   UploadOutlined,
//   DownloadOutlined,
//   PlusOutlined,
// } from "@ant-design/icons";
// import FileUploadSection from "@/components/export-flow/FileUploadSection";
// import UseExportForm from "@/components/export-flow/UseExportForm";
// import LoanExportForm from "@/components/export-flow/LoanExportForm";
// import ExcelDataTable from "@/components/export-flow/ExcelDataTable";
// import SelectModal from "@/components/export-flow/SelectModal";
// import useItemService from "@/hooks/useItemService";
// import useExportRequestService from "@/hooks/useExportRequestService";
// import useExportRequestDetailService from "@/hooks/useExportRequestDetailService";
// import { useSelector } from "react-redux";

// const { Title } = Typography;
// const { Option } = Select;

// const ExportRequestCreate = () => {
//   // --- State cho file upload và kiểm tra dữ liệu ---
//   const [data, setData] = useState([]);
//   const [fileName, setFileName] = useState("");
//   const [file, setFile] = useState(null);
//   const [validationError, setValidationError] = useState("");
//   const fileInputRef = useRef(null);
//   const navigate = useNavigate();
//   // --- Lấy danh sách sản phẩm ---
//   const [items, setItems] = useState([]);
//   const { loading: itemLoading, getItems } = useItemService();
//   useEffect(() => {
//     const fetchItems = async () => {
//       try {
//         const itemsData = await getItems();
//         console.log("Items:", itemsData);
//         setItems(itemsData || []);
//       } catch (error) {
//         console.error("Error fetching items:", error);
//         toast.error("Không thể lấy danh sách sản phẩm");
//       }
//     };
//     fetchItems();
//   }, []);

//   // --- State cho dữ liệu form ---
//   // Dữ liệu form được thiết kế theo giao diện của UseExportForm và LoanExportForm
//   const [formData, setFormData] = useState({
//     exportType: "PRODUCTION", // hoặc "LOAN"
//     exportDate: moment().format("YYYY-MM-DD"),
//     exportTime: moment().format("HH:mm:ss"),
//     exportReason: "",
//     note: "",
//     // Dành cho Production:
//     receivingDepartment: null, // đối ứng với departmentId
//     departmentRepresentative: "", // đối ứng với receiverName (nội bộ)
//     departmentRepresentativePhone: "", // đối ứng với receiverPhone (nội bộ)
//     // Dành cho LOAN:
//     loanType: "INTERNAL", // "INTERNAL" hoặc "EXTERNAL"
//     borrowerName: "",
//     borrowerPhone: "",
//     borrowerAddress: "",
//     returnDate: "", // expectedReturnDate
//     loanReason: "",
//   });

//   // --- Dữ liệu mẫu và state hiển thị modal cho danh sách phòng ban ---
//   const departments = [
//     { id: 1, name: "Bộ phận A" },
//     { id: 2, name: "Phân xưởng B" },
//     { id: 3, name: "Bộ phận C" },
//   ];
//   const [departmentModalVisible, setDepartmentModalVisible] = useState(false);

//   // --- Fake API: Lấy chi tiết phòng ban (dành cho Production) ---
//   const fakeFetchDepartmentDetails = (department) => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         const details = {
//           1: { receiverName: "Người đại diện A", receiverPhone: "0123456789" },
//           2: { receiverName: "Người đại diện B", receiverPhone: "0987654321" },
//           3: { receiverName: "Người đại diện C", receiverPhone: "0912345678" },
//         };
//         resolve(details[department.id]);
//       }, 500);
//     });
//   };

//   // --- Các hàm xử lý file Excel ---
//   const handleFileUpload = (e) => {
//     const uploadedFile = e.target.files[0];
//     if (uploadedFile) {
//       setFile(uploadedFile);
//       setFileName(uploadedFile.name);
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         const ab = event.target.result;
//         const wb = XLSX.read(ab, { type: "array" });
//         const ws = wb.Sheets[wb.SheetNames[0]];
//         const jsonData = XLSX.utils.sheet_to_json(ws);
//         try {
//           const transformedData = jsonData.map((item, index) => {
//             const itemId = item["itemId"] || item["Mã hàng"];
//             const quantity = item["quantity"] || item["Số lượng"];
//             if (!itemId || !quantity) {
//               throw new Error(
//                 `Dòng ${index + 1}: Thiếu thông tin itemId hoặc quantity`
//               );
//             }
//             return {
//               itemId: Number(itemId),
//               quantity: Number(quantity),
//             };
//           });
//           setData(transformedData);
//           setValidationError("");
//         } catch (error) {
//           setValidationError(error.message);
//           toast.error(error.message);
//         }
//       };
//       reader.readAsArrayBuffer(uploadedFile);
//     }
//   };
//   const triggerFileInput = () => fileInputRef.current.click();
//   const downloadTemplate = () => {
//     const template = [{ itemId: "Mã hàng (số)", quantity: "Số lượng (số)" }];
//     const ws = XLSX.utils.json_to_sheet(template);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Template");
//     XLSX.writeFile(wb, "export_request_template.xlsx");
//   };

//   // --- API hooks cho phiếu xuất ---
//   const { createExportRequestProduction, createExportRequestLoan } =
//     useExportRequestService();
//   const { createExportRequestDetail } = useExportRequestDetailService();

//   // --- Hàm xử lý submit ---
//   const handleSubmit = async () => {
//     // Kiểm tra thông tin chung
//     if (!formData.exportDate || !formData.exportTime) {
//       toast.error("Vui lòng điền đầy đủ thông tin chung cho phiếu xuất");
//       return;
//     }
//     // Kiểm tra file và dữ liệu Excel
//     if (!file || data.length === 0) {
//       toast.error("Vui lòng tải lên file Excel với dữ liệu hợp lệ");
//       return;
//     }

//     let payload = {};
//     let createdExport;

//     if (formData.exportType === "PRODUCTION") {
//       // Validate các trường bắt buộc cho Production
//       if (
//         !formData.exportReason ||
//         !formData.receivingDepartment ||
//         !formData.departmentRepresentative ||
//         !formData.departmentRepresentativePhone
//       ) {
//         toast.error("Vui lòng điền đầy đủ thông tin cho phiếu xuất Production");
//         return;
//       }
//       payload = {
//         exportReason: formData.exportReason,
//         departmentId: formData.receivingDepartment.id,
//         receiverName: formData.departmentRepresentative,
//         receiverPhone: formData.departmentRepresentativePhone,
//         type: "PRODUCTION",
//         exportDate: formData.exportDate,
//         exportTime: formData.exportTime,
//       };
//       createdExport = await createExportRequestProduction(payload);
//     } else if (formData.exportType === "LOAN") {
//       // Cập nhật payload với type là "BORROWING"
//       if (!formData.returnDate || !formData.loanReason) {
//         toast.error("Vui lòng điền đầy đủ thông tin cho phiếu xuất mượn");
//         return;
//       }
//       // Kiểm tra ngày trả phải lớn hơn ngày hiện tại
//       if (
//         moment(formData.returnDate, "YYYY-MM-DD").isSameOrBefore(
//           moment(),
//           "day"
//         )
//       ) {
//         toast.error("Ngày trả phải lớn hơn ngày hôm nay");
//         return;
//       }

//       if (formData.loanType === "INTERNAL") {
//         if (
//           !formData.receivingDepartment ||
//           !formData.departmentRepresentative ||
//           !formData.departmentRepresentativePhone
//         ) {
//           toast.error(
//             "Vui lòng chọn phòng ban và thông tin đại diện cho phiếu xuất mượn nội bộ"
//           );
//           return;
//         }
//         payload = {
//           exportDate: formData.exportDate,
//           exportTime: formData.exportTime,
//           receiverName: formData.departmentRepresentative,
//           receiverPhone: formData.departmentRepresentativePhone,
//           departmentId: formData.receivingDepartment.id,
//           expectedReturnDate: formData.returnDate,
//           exportReason: formData.loanReason,
//           type: "BORROWING",
//         };
//       } else if (formData.loanType === "EXTERNAL") {
//         if (
//           !formData.borrowerName ||
//           !formData.borrowerPhone ||
//           !formData.borrowerAddress
//         ) {
//           toast.error(
//             "Vui lòng điền đầy đủ thông tin cho phiếu xuất mượn bên ngoài"
//           );
//           return;
//         }
//         payload = {
//           exportDate: formData.exportDate,
//           exportTime: formData.exportTime,
//           receiverName: formData.borrowerName,
//           receiverPhone: formData.borrowerPhone,
//           receiverAddress: formData.borrowerAddress,
//           expectedReturnDate: formData.returnDate,
//           exportReason: formData.loanReason,
//           type: "BORROWING",
//         };
//       }
//       createdExport = await createExportRequestLoan(payload);
//     } else {
//       toast.error("Loại phiếu xuất không hợp lệ");
//       return;
//     }

//     if (!createdExport) {
//       toast.error("Không tạo được phiếu xuất");
//       return;
//     }

//     // Upload file Excel làm chi tiết phiếu xuất
//     const fd = new FormData();
//     fd.append("file", file);
//     await createExportRequestDetail(fd, createdExport.exportRequestId);

//     navigate(ROUTES.PROTECTED.EXPORT.REQUEST.LIST);

//     // Reset lại trạng thái sau khi submit
//     setFormData({
//       exportType: "PRODUCTION",
//       exportDate: moment().format("YYYY-MM-DD"),
//       exportTime: moment().format("HH:mm:ss"),
//       exportReason: "",
//       note: "",
//       receivingDepartment: null,
//       departmentRepresentative: "",
//       departmentRepresentativePhone: "",
//       loanType: "INTERNAL",
//       borrowerName: "",
//       borrowerPhone: "",
//       borrowerAddress: "",
//       returnDate: "",
//       loanReason: "",
//     });
//     setFile(null);
//     setFileName("");
//     setData([]);
//   };

//   // --- Mapping dữ liệu Excel để hiển thị ---
//   const mappedData = data.map((row) => {
//     const foundItem = items.content.find((i) => i.id === row.itemId);
//     return {
//       ...row,
//       itemName: foundItem ? foundItem.name : "Không xác định",
//     };
//   });

//   return (
//     <div className="container mx-auto p-5">
//       <div className="flex justify-between items-center mb-4">
//         <Title level={2}>Tạo phiếu xuất</Title>
//         <Space>
//           <FileUploadSection
//             fileName={fileName}
//             onDownloadTemplate={downloadTemplate}
//             onTriggerFileInput={triggerFileInput}
//           />
//           <input
//             type="file"
//             ref={fileInputRef}
//             accept=".xlsx,.xls"
//             onChange={handleFileUpload}
//             style={{ display: "none" }}
//           />
//         </Space>
//       </div>

//       {validationError && (
//         <Alert
//           message="Lỗi dữ liệu"
//           description={validationError}
//           type="error"
//           showIcon
//           className="mb-4"
//           closable
//         />
//       )}

//       <div className="mb-4">
//         <Space direction="horizontal">
//           <span className="font-semibold">Loại phiếu xuất: </span>
//           <Select
//             value={formData.exportType}
//             onChange={(value) =>
//               setFormData({ ...formData, exportType: value })
//             }
//             style={{ width: 300 }}
//           >
//             <Option value="PRODUCTION">Xuất sản xuất</Option>
//             <Option value="LOAN">Xuất mượn</Option>
//           </Select>
//         </Space>
//       </div>

//       <div className="flex gap-6">
//         <Card title="Thông tin phiếu xuất" className="w-1/3">
//           <Space direction="vertical" className="w-full">
//             {formData.exportType === "PRODUCTION" && (
//               <UseExportForm
//                 formData={formData}
//                 setFormData={setFormData}
//                 openDepartmentModal={() => setDepartmentModalVisible(true)}
//               />
//             )}
//             {formData.exportType === "LOAN" && (
//               <LoanExportForm
//                 formData={formData}
//                 setFormData={setFormData}
//                 openDepartmentModal={() => setDepartmentModalVisible(true)}
//               />
//             )}
//             <Button
//               type="primary"
//               onClick={handleSubmit}
//               className="w-full mt-4"
//               disabled={data.length === 0 || !!validationError}
//             >
//               Xác nhận tạo phiếu xuất
//             </Button>
//           </Space>
//         </Card>

//         <div className="w-2/3">
//           <Card title="Chi tiết hàng hóa từ file Excel">
//             {mappedData.length > 0 ? (
//               <ExcelDataTable data={mappedData} />
//             ) : (
//               <div className="text-center py-10 text-gray-500">
//                 Vui lòng tải lên file Excel để xem chi tiết hàng hóa
//               </div>
//             )}
//           </Card>
//         </div>
//       </div>

//       {/* Modal chọn phòng ban */}
//       <SelectModal
//         visible={departmentModalVisible}
//         title="Chọn bộ phận/phân xưởng"
//         data={departments}
//         onSelect={async (selectedDepartment) => {
//           const details = await fakeFetchDepartmentDetails(selectedDepartment);
//           setFormData({
//             ...formData,
//             receivingDepartment: selectedDepartment,
//             departmentRepresentative: details?.receiverName || "",
//             departmentRepresentativePhone: details?.receiverPhone || "",
//           });
//           setDepartmentModalVisible(false);
//         }}
//         onCancel={() => setDepartmentModalVisible(false)}
//       />
//     </div>
//   );
// };

// export default ExportRequestCreate;
