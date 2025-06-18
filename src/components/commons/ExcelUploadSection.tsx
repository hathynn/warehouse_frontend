import React, { ChangeEvent, RefObject, useState } from "react";
import { Button, Modal } from "antd";
import { UploadOutlined, DownloadOutlined, CloseCircleOutlined } from "@ant-design/icons";

interface ExcelUploadSectionProps {
  fileName: string;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  onRemoveFile?: () => void;
  accept?: string;
  buttonLabel?: string;
  infoMessage?: React.ReactNode;
  fileInputRef?: RefObject<HTMLInputElement | null>;
}

const ExcelUploadSection: React.FC<ExcelUploadSectionProps> = ({
  fileName,
  onFileChange,
  onDownloadTemplate,
  onRemoveFile,
  accept = ".xlsx,.xls",
  buttonLabel = "Tải lên file Excel",
  infoMessage,
  fileInputRef,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 justify-center">
          <Button icon={<DownloadOutlined />} onClick={onDownloadTemplate}>
            Tải mẫu Excel
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
            className="bg-blue-100 hover:bg-blue-200 border-blue-300"
          >
            {buttonLabel}
          </Button>
        </div>
        {fileName && (
          <div className="flex justify-center">
            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-md border border-gray-200 w-300">
              <div className="flex-1 flex justify-center items-center">
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
        <div className="text-sm text-blue-600 mt-3 flex items-center">
          {infoMessage}
        </div>
      )}

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
        <p>Bạn có chắc muốn xóa file đã chọn?</p>
        <p>File đã chọn và dữ liệu xem trước sẽ bị xóa hoàn toàn.</p>
      </Modal>
    </div>
  );
};

export default ExcelUploadSection; 