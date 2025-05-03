// ExportRequestHeader.jsx
import React from "react";
import { Button, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const { Title } = Typography;

const ExportRequestHeader = ({ title, onBack }) => (
  <div className="flex items-center mb-4 justify-between">
    <Button icon={<ArrowLeftOutlined />} onClick={onBack} className="mr-4">
      Quay lại
    </Button>

    <Title level={2}>{title}</Title>
  </div>
);

ExportRequestHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
};
export default ExportRequestHeader;
