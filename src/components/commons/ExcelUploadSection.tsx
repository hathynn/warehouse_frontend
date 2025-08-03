import React, { ChangeEvent, RefObject, useState } from "react";
import { Button, Modal } from "antd";
import { UploadOutlined, DownloadOutlined, CloseCircleOutlined } from "@ant-design/icons";
import templateXuatBan from "@/assets/export-templates/template_xuat_ban.xlsx";
import templateXuatNoiBo from "@/assets/export-templates/template_xuat_noi_bo.xlsx";
import templatePhieuNhap from "@/assets/import-templates/template_phieu_nhap.xlsx";
import templatePhieuKiemKho from "@/assets/stock-check-templates/template_kiem_kho.xlsx";

const TYPE_LABELS = {
  SELLING: "xuất bán",
  EXPORT_RETURN: "xuất trả nhà cung cấp",
  INTERNAL: "xuất nội bộ",
  LIQUIDATION: "xuất thanh lý",
  IMPORT_REQUEST: "phiếu nhập",
  STOCK_CHECK_REQUEST: "phiếu kiểm kho"
};

const TEMPLATE_FILES = {
  SELLING: templateXuatBan,
  INTERNAL: templateXuatNoiBo,
  IMPORT_REQUEST: templatePhieuNhap,
  STOCK_CHECK_REQUEST: templatePhieuKiemKho
};

interface ExcelUploadSectionProps {
  fileName: string;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile?: () => void;
  accept?: string;
  buttonLabel?: string;
  infoMessage?: React.ReactNode;
  fileInputRef?: RefObject<HTMLInputElement | null>;
  type?: string;
}

const ExcelUploadSection: React.FC<ExcelUploadSectionProps> = ({
  fileName,
  onFileChange,
  onRemoveFile,
  accept = ".xlsx,.xls",
  buttonLabel = "Tải lên file Excel",
  infoMessage,
  fileInputRef,
  type,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleDownloadTemplate = () => {
    if (type && TEMPLATE_FILES[type as keyof typeof TEMPLATE_FILES]) {
      const templatePath = TEMPLATE_FILES[type as keyof typeof TEMPLATE_FILES];

      const link = document.createElement("a");
      link.href = templatePath;

      const fileNames = {
        SELLING: "template_xuat_ban.xlsx",
        INTERNAL: "template_xuat_noi_bo.xlsx",
        IMPORT_REQUEST: "template_phieu_nhap.xlsx",
        STOCK_CHECK_REQUEST: "template_kiem_kho.xlsx",
      };

      link.download = fileNames[type as keyof typeof fileNames] || "template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  const triggerFileInput = () => {
    fileInputRef?.current?.click();
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
    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
      <div className="flex flex-col gap-3">
        <div className="flex justify-center gap-3">
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Tải mẫu Excel
            {type && TYPE_LABELS[type as keyof typeof TYPE_LABELS] && (
              <span className="font-semibold">
                {TYPE_LABELS[type as keyof typeof TYPE_LABELS]}
              </span>
            )}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            accept={accept}
            onChange={onFileChange}
            style={{ display: "none" }}
          />
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={triggerFileInput}
            className="bg-blue-100 border-blue-300 hover:bg-blue-200"
          >
            {buttonLabel}
          </Button>
        </div>
        {fileName && (
          <div className="flex justify-center">
            <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-md w-300">
              <div className="flex items-center justify-center flex-1">
                <span className="text-gray-600 truncate" title={fileName}>
                  File đã chọn: <span className="font-medium text-gray-800">{fileName}</span>
                </span>
              </div>
              {onRemoveFile && (
                <Button
                  type="text"
                  size="large"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={handleRemoveClick}
                />
              )}
            </div>
          </div>
        )}
      </div>
      {infoMessage && (
        <div className="flex items-center mt-3 text-sm text-blue-600">
          {infoMessage}
        </div>
      )}

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
          File đã chọn và dữ liệu xem trước sẽ bị xóa hoàn toàn.
        </p>
      </Modal>
    </div>
  );
};

export default ExcelUploadSection;