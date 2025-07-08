import React, { useState } from "react";
import { Button, Modal } from "antd";
import {
  CloseCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import PropTypes from "prop-types";

const EXPORT_TYPE_LABELS = {
  SELLING: "xuất bán",
  RETURN: "xuất trả nhà cung cấp",
  PRODUCTION: "xuất sản xuất",
  BORROWING: "xuất mượn",
  LIQUIDATION: "xuất thanh lý",
};

const FileUploadSection = ({
  fileName,
  exportType,
  onTriggerFileInput,
  onRemoveFile,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleDownloadTemplate = () => {
    let template = [];
    const wb = XLSX.utils.book_new();

    if (exportType === "SELLING") {
      // Tạo sheet dữ liệu xuất bán với thông tin form ở đầu
      const exportData = [
        // 5 dòng đầu chứa thông tin form
        ["exportType", "SELLING"],
        ["exportReason", "Xuất bán"],
        ["receiverName", "{Điền tên người nhận}"],
        ["receiverPhone", "{Điền SĐT người nhận}"],
        ["receiverAddress", "{Điền địa chỉ người nhận}"],
        [], // Dòng trống
        [], // Dòng trống
        // Header cho dữ liệu sản phẩm
        ["itemId", "quantity"],
        ["Mã hàng", "Số lượng"],
      ];

      const ws = XLSX.utils.aoa_to_sheet(exportData);

      // Set độ rộng cột
      ws["!cols"] = [
        { wch: 20 }, // Cột A - rộng hơn cho thông tin form
        { wch: 25 }, // Cột B - rộng hơn cho nội dung form
      ];

      // Merge cells cho phần header thông tin form (optional - để đẹp hơn)
      ws["!merges"] = [
        { s: { r: 0, c: 2 }, e: { r: 4, c: 2 } }, // Merge cột C từ dòng 1-5
      ];

      // Thêm ghi chú/hướng dẫn
      const instructionWs = XLSX.utils.aoa_to_sheet([
        ["HƯỚNG DẪN SỬ DỤNG FILE TEMPLATE XUẤT BÁN"],
        [""],
        ["PHẦN 1: THÔNG TIN PHIẾU XUẤT (5 dòng đầu)"],
        ["'- exportType: Loại xuất (SELLING - không thay đổi)"],
        ["'- exportReason: Lý do xuất kho"],
        ["'- receiverName: Tên người nhận hàng"],
        ["'- receiverPhone: Số điện thoại người nhận"],
        ["'- receiverAddress: Địa chỉ người nhận (không bắt buộc)"],
        [""],
        ["PHẦN 2: DANH SÁCH SẢN PHẨM (từ dòng 9)"],
        ["'- itemId: Mã sản phẩm"],
        ["'- quantity: Số lượng cần xuất (số nguyên dương)"],
        [""],
        ["LƯU Ý QUAN TRỌNG:"],
        ["'- Không thay đổi vị trí và tên các trường ở 5 dòng đầu"],
        ["'- Không thay đổi tên các cột ở dòng 8"],
        ["'- Mã sản phẩm phải tồn tại trong hệ thống"],
        ["'- Số lượng phải là số dương"],
        ["'- Bắt đầu nhập dữ liệu sản phẩm từ dòng 9"],
        ["'- Thêm dấu ' ở trước SĐT người nhận để đúng định dạng SĐT"],
      ]);

      // Set độ rộng cho sheet hướng dẫn
      instructionWs["!cols"] = [{ wch: 60 }];

      // Thêm sheets vào workbook - Dữ liệu xuất bán lên đầu, Hướng dẫn thứ 2
      XLSX.utils.book_append_sheet(wb, ws, "Dữ liệu xuất bán");
      XLSX.utils.book_append_sheet(wb, instructionWs, "Hướng dẫn");
    } else if (exportType === "PRODUCTION") {
      // Tạo sheet dữ liệu xuất sản xuất với thông tin form ở đầu
      const exportData = [
        // 3 dòng đầu chứa thông tin form
        ["exportType", "PRODUCTION"],
        ["exportReason", "{Điền lý do xuất sản xuất}"],
        ["departmentId", "{Điền mã phòng ban}"],
        [], // Dòng trống
        [], // Dòng trống
        // Header cho dữ liệu sản phẩm
        ["itemId", "measurementValue"],
        ["Mã sản phẩm", "Giá trị đo lường"],
      ];

      const ws = XLSX.utils.aoa_to_sheet(exportData);

      // Set độ rộng cột
      ws["!cols"] = [
        { wch: 20 }, // Cột A - rộng hơn cho thông tin form
        { wch: 25 }, // Cột B - rộng hơn cho nội dung form
      ];

      // Merge cells cho phần header thông tin form (optional - để đẹp hơn)
      ws["!merges"] = [
        { s: { r: 0, c: 2 }, e: { r: 2, c: 2 } }, // Merge cột C từ dòng 1-3
      ];

      // Thêm ghi chú/hướng dẫn
      const instructionWs = XLSX.utils.aoa_to_sheet([
        ["HƯỚNG DẪN SỬ DỤNG FILE TEMPLATE XUẤT SẢN XUẤT"],
        [""],
        ["PHẦN 1: THÔNG TIN PHIẾU XUẤT (3 dòng đầu)"],
        ["'- exportType: Loại xuất (PRODUCTION - không thay đổi)"],
        [
          "'- exportReason: Lý do xuất sản xuất (ví dụ: Sản xuất áo thun, Gia công...)",
        ],
        ["'- departmentId: Mã phòng ban sản xuất"],
        [""],
        ["PHẦN 2: DANH SÁCH SẢN PHẨM (từ dòng 7)"],
        ["'- itemId: Mã sản phẩm cần xuất"],
        ["'- measurementValue: Giá trị đo lường theo đơn vị của sản phẩm"],
        [""],
        ["LƯU Ý VỀ MEASUREMENT VALUE:"],
        [
          "'- Khác với quantity (số lượng), measurementValue tính theo đơn vị đo",
        ],
        ["'- Ví dụ: Vải sẽ tính theo mét (m), ..."],
        [
          "'- Giá trị đo lường (measurementValue) phải là số dương (có thể là số thập phân)",
        ],
        [""],
        ["LƯU Ý QUAN TRỌNG:"],
        ["'- Không thay đổi vị trí và tên các trường ở 3 dòng đầu"],
        ["'- Không thay đổi tên các cột ở dòng 6"],
        ["'- Mã sản phẩm phải tồn tại trong hệ thống"],
        ["'- departmentId phải là mã phòng ban hợp lệ, là số nguyên"],
        ["'- measurementValue phải phù hợp với đơn vị của sản phẩm"],
        ["'- Bắt đầu nhập dữ liệu sản phẩm từ dòng 7"],
      ]);

      // Set độ rộng cho sheet hướng dẫn
      instructionWs["!cols"] = [{ wch: 70 }];

      // Thêm sheets vào workbook - Dữ liệu xuất sản xuất lên đầu, Hướng dẫn thứ 2
      XLSX.utils.book_append_sheet(wb, ws, "Dữ liệu xuất sản xuất");
      XLSX.utils.book_append_sheet(wb, instructionWs, "Hướng dẫn");
    } else if (exportType === "RETURN") {
      template = [
        {
          itemId: "Mã hàng",
          quantity: "Số lượng",
          providerId: "Mã Nhà cung cấp",
        },
      ];
      const ws = XLSX.utils.json_to_sheet(template);
      XLSX.utils.book_append_sheet(wb, ws, "Template");
    } else {
      // Template mặc định cho các loại khác
      template = [
        {
          itemId: "Mã hàng",
          quantity: "Số lượng",
        },
      ];
      const ws = XLSX.utils.json_to_sheet(template);
      XLSX.utils.book_append_sheet(wb, ws, "Template");
    }

    // Download export request template based on type of the request
    const fileNames = {
      RETURN: "template_xuat_tra_NCC.xlsx",
      SELLING: "template_xuat_ban.xlsx",
      PRODUCTION: "template_xuat_san_xuat.xlsx",
      BORROWING: "template_xuat_muon.xlsx",
      LIQUIDATION: "template_xuat_thanh_ly.xlsx",
    };

    const fileName = fileNames[exportType] || "export_request_template.xlsx";
    XLSX.writeFile(wb, fileName);
  };

  const handleRemoveClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = () => {
    setShowConfirmModal(false);
    if (onRemoveFile) {
      onRemoveFile();
    }
  };

  const handleCancelRemove = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 justify-center items-start">
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Tải mẫu Excel{" "}
            <span className="font-semibold">
              {EXPORT_TYPE_LABELS[exportType] || exportType}
            </span>
          </Button>

          {/* Nút tải lên file */}
          <div className="flex flex-col items-center">
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={onTriggerFileInput}
            >
              Tải lên file Excel
            </Button>
          </div>
        </div>

        {fileName && (
          <div className="flex justify-center">
            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-md border border-gray-200 w-300">
              <div className="flex-1 flex justify-center items-center">
                <span className="text-gray-600 truncate" title={fileName}>
                  File đã chọn:{" "}
                  <span className="font-medium text-gray-800">{fileName}</span>
                </span>
              </div>
              <Button
                type="text"
                size="large"
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleRemoveClick}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal xác nhận xóa file */}
      <Modal
        title="Xác nhận xóa file"
        open={showConfirmModal}
        onOk={handleConfirmRemove}
        onCancel={handleCancelRemove}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p className="text-red-600 font-semibold">
          Bạn có chắc muốn xóa file đã chọn?
        </p>
        <p>
          * File đã chọn và dữ liệu xem trước sẽ bị xóa hoàn toàn đối với loại
          xuất này.
        </p>
      </Modal>
    </div>
  );
};

FileUploadSection.propTypes = {
  fileName: PropTypes.string,
  exportType: PropTypes.string,
  onTriggerFileInput: PropTypes.func.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
};

export default FileUploadSection;
