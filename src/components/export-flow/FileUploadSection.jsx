import React from "react";
import { Button, Space } from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const FileUploadSection = ({
  fileName,
  onDownloadTemplate,
  onTriggerFileInput,
}) => {
  return (
    <Space>
      <Button icon={<DownloadOutlined />} onClick={onDownloadTemplate}>
        Tải mẫu Excel
      </Button>
      <Button
        type="primary"
        icon={<UploadOutlined />}
        onClick={onTriggerFileInput}
      >
        Tải lên file Excel
      </Button>
      {fileName && <span className="ml-2 text-gray-500">{fileName}</span>}
    </Space>
  );
};

FileUploadSection.propTypes = {
  fileName: PropTypes.string,
  onDownloadTemplate: PropTypes.func.isRequired,
  onTriggerFileInput: PropTypes.func.isRequired,
};
export default FileUploadSection;
