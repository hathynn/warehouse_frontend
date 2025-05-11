import React, { ChangeEvent, RefObject } from "react";
import { Button } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";

interface ExcelUploadSectionProps {
  fileName: string;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  accept?: string;
  buttonLabel?: string;
  infoMessage?: React.ReactNode;
  fileInputRef?: RefObject<HTMLInputElement | null>;
}

const ExcelUploadSection: React.FC<ExcelUploadSectionProps> = ({
  fileName,
  onFileChange,
  onDownloadTemplate,
  accept = ".xlsx,.xls",
  buttonLabel = "Tải lên file Excel",
  infoMessage,
  fileInputRef,
}) => {
  const triggerFileInput = () => {
    fileInputRef?.current?.click();
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
          <div className="flex justify-center items-center bg-white px-3 py-2 rounded-md border border-gray-200">
            <span className="text-gray-600 truncate" title={fileName}>
              File đã chọn: <span className="font-medium text-gray-800">{fileName}</span>
            </span>
          </div>
        )}
      </div>
      {infoMessage && (
        <div className="text-sm text-blue-600 mt-3 flex items-center">
          {infoMessage}
        </div>
      )}
    </div>
  );
};

export default ExcelUploadSection; 