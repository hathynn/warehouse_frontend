import React from "react";
import { Space, Select } from "antd";

const { Option } = Select;

export type ExportRequestType = "SELLING" | "RETURN" | "INTERNAL" | "LIQUIDATION";
export type ImportRequestType = "ORDER" | "RETURN";
export type RequestType = ExportRequestType | ImportRequestType | null;;

interface RequestOption {
    value: RequestType;
    label: string;
}

interface RequestTypeSelectorProps {
    requestType: RequestType;
    setRequestType: (value: RequestType) => void;
    mode: "export" | "import";
    className?: string;
    selectWidth?: number;
    disabled?: boolean;
}

const EXPORT_OPTIONS: RequestOption[] = [
    { value: "SELLING", label: "Xuất bán" },
    { value: "RETURN", label: "Xuất trả nhà cung cấp" },
    { value: "INTERNAL", label: "Xuất nội bộ" },
    // { value: "LIQUIDATION", label: "Xuất thanh lý" },
];

const IMPORT_OPTIONS: RequestOption[] = [
    { value: "ORDER", label: "Nhập theo kế hoạch" },
    { value: "RETURN", label: "Nhập trả" },
];

const RequestTypeSelector: React.FC<RequestTypeSelectorProps> = ({
    requestType,
    setRequestType,
    mode,
    className = "mb-4",
    selectWidth = 240,
    disabled = false,
}) => {
    const options = mode === "export" ? EXPORT_OPTIONS : IMPORT_OPTIONS;
    const label = mode === "export" ? "Loại phiếu xuất:" : "Loại phiếu nhập:";

    return (
        <Space direction="horizontal" className={className}>
            <span className="font-semibold text-base">
                {label} <span className="text-red-500">*</span>
            </span>
            <Select
                size="large"
                value={requestType}
                onChange={(value: RequestType) => setRequestType(value)}
                style={{ width: selectWidth }}
                disabled={disabled}
                placeholder={`Chọn ${mode === "export" ? "loại xuất" : "loại nhập"}`}
            >
                {options.map((option) => (
                    <Option key={option.value} value={option.value}>
                        {option.label}
                    </Option>
                ))}
            </Select>
        </Space>
    );
};

export default RequestTypeSelector; 