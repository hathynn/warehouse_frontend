import React, { useState, useEffect } from "react";
import { Table, Input } from "antd";
import PropTypes from "prop-types";
import { InfoCircleFilled } from "@ant-design/icons";

const ExcelDataTable = ({
  data,
  onDataChange,
  items,
  onTableErrorChange,
  pagination,
  onPaginationChange,
  setPagination,
  readOnly = false,
}) => {
  const [fieldErrors, setFieldErrors] = useState({});

  // Validate giá trị đo lường mong muốn
  const validateExpectedMeasurementValue = (value) => {
    if (value === "" || value === undefined || value === null) {
      return "Vui lòng nhập giá trị!"; // Thay đổi từ "" thành bắt buộc nhập
    }

    // Kiểm tra có phải số nguyên không
    if (!/^\d+$/.test(value)) {
      return "Chỉ được nhập số nguyên!";
    }

    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return "Phải lớn hơn 0!";
    }

    return "";
  };

  // Reset states when data changes completely
  useEffect(() => {
    if (onTableErrorChange) {
      onTableErrorChange(false);
    }
  }, [onTableErrorChange]);

  // Validate tất cả các field khi data thay đổi
  useEffect(() => {
    const newErrors = {};

    data.forEach((item) => {
      if (item.expectedMeasurementValue !== undefined) {
        const error = validateExpectedMeasurementValue(
          item.expectedMeasurementValue
        );
        if (error) {
          newErrors[item.itemId] = error;
        }
      }
    });

    setFieldErrors(newErrors);
    if (onTableErrorChange) {
      onTableErrorChange(Object.keys(newErrors).length > 0);
    }
  }, [data, onTableErrorChange]);

  // Component cho input giá trị đo lường mong muốn
  const ExpectedMeasurementValueInput = ({ record }) => {
    const [localValue, setLocalValue] = useState(
      record.expectedMeasurementValue || ""
    );

    useEffect(() => {
      setLocalValue(record.expectedMeasurementValue || "");
    }, [record.expectedMeasurementValue]);

    const handleChange = (e) => {
      let value = e.target.value;

      // Chỉ cho phép số
      value = value.replace(/[^0-9]/g, "");

      setLocalValue(value);
    };

    const handleBlur = () => {
      // Update data khi blur
      const updatedData = data.map((item) =>
        String(item.itemId) === String(record.itemId)
          ? { ...item, expectedMeasurementValue: localValue }
          : item
      );
      onDataChange(updatedData);
    };

    return (
      <div>
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          value={localValue}
          style={{ textAlign: "right", width: 90 }}
          onWheel={(e) => e.currentTarget.blur()}
          onKeyDown={(e) => {
            // Chặn các ký tự không hợp lệ
            if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
              e.preventDefault();
            }
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          onChange={handleChange}
          onBlur={handleBlur}
          status={fieldErrors[record.itemId] ? "error" : undefined}
          placeholder="Nhập số"
        />
        {fieldErrors[record.itemId] && (
          <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
            {fieldErrors[record.itemId]}
          </div>
        )}
      </div>
    );
  };

  ExpectedMeasurementValueInput.propTypes = {
    record: PropTypes.shape({
      expectedMeasurementValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      itemId: PropTypes.string.isRequired,
    }).isRequired,
  };

  const columns = [
    {
      width: "13%",
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
      render: (text) => <div>{text}</div>,
    },
    {
      width: "18%",
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      width: "17%",
      title: <span className="font-semibold">Quy cách</span>,
      dataIndex: "measurementValue",
      key: "measurementValue",
      align: "center",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (_, record) => {
        const itemMeta = items.find(
          (i) => String(i.id) === String(record.itemId)
        );
        const measurementValueFromDB = itemMeta?.measurementValue || "";

        return (
          <span>
            <strong style={{ fontSize: "17px" }}>
              {measurementValueFromDB}
            </strong>{" "}
            {record.measurementUnit} / {record.unitType}
          </span>
        );
      },
    },
    {
      width: "22%",
      title: <span className="font-semibold">Giá trị mong muốn</span>,
      dataIndex: "expectedMeasurementValue",
      key: "expectedMeasurementValue",
      align: "center",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (_, record) =>
        readOnly ? (
          <span style={{ display: "block", textAlign: "center" }}>
            <strong style={{ fontSize: "17px" }}>
              {record.expectedMeasurementValue}
            </strong>{" "}
            {record.measurementUnit}
          </span>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <ExpectedMeasurementValueInput record={record} />
            <span style={{ fontSize: "14px", fontWeight: "500" }}>
              {record.measurementUnit}
            </span>
          </div>
        ),
    },
    {
      width: "20%",
      title: <span className="font-semibold">Giá trị hệ thống</span>,
      dataIndex: "numberOfAvailableMeasurementValues",
      key: "numberOfAvailableMeasurementValues",
      onHeaderCell: () => ({
        style: { textAlign: "center" },
      }),
      render: (text, record) => (
        <span style={{ display: "block", textAlign: "center" }}>
          <strong style={{ fontSize: "17px" }}>{text}</strong>{" "}
          {record.measurementUnit}
        </span>
      ),
    },
  ];

  return (
    <>
      {/* Thông tin kiểm kho */}
      <div
        style={{
          backgroundColor: "#e6f7ff",
          border: "1px solid #91d5ff",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          <InfoCircleFilled
            style={{ color: "#1677ff", fontSize: 22, marginRight: 8 }}
          />
          Thông tin kiểm kho
        </div>
        <div style={{ marginTop: 4 }}>
          Tổng số mặt hàng yêu cầu kiểm kho: {data.length}
        </div>

        {/* Hiển thị lỗi validation nếu có */}
        {Object.keys(fieldErrors).length > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: "#fff1f0",
              border: "1px solid #ff7875",
              borderRadius: 6,
              borderLeft: "4px solid #ff4d4f",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#cf1322",
                }}
              >
                Lỗi nhập liệu
              </div>
              <div
                style={{
                  marginLeft: 8,
                  backgroundColor: "#ff4d4f",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {Object.keys(fieldErrors).length}
              </div>
            </div>
            <div
              style={{
                color: "#cf1322",
                fontSize: "13px",
              }}
            >
              Vui lòng sửa lại các giá trị không hợp lệ trước khi tiếp tục.
            </div>
          </div>
        )}
      </div>

      {/* Bảng dữ liệu */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record) => String(record?.itemId)}
        pagination={pagination.total > pagination.pageSize ? pagination : false}
        onChange={onPaginationChange}
        rowClassName={(_, index) => (index % 2 === 1 ? "bg-gray-100" : "")}
        components={{
          body: {
            row: ({ children, ...restProps }) => (
              <tr {...restProps} id={`row-${restProps["data-row-key"]}`}>
                {children}
              </tr>
            ),
          },
        }}
      />
    </>
  );
};

ExcelDataTable.propTypes = {
  record: PropTypes.shape({
    itemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    expectedMeasurementValue: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    // thêm để hết cảnh báo:
    measurementUnit: PropTypes.string,
    unitType: PropTypes.string,
  }).isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      itemName: PropTypes.string.isRequired,
      unitType: PropTypes.string.isRequired,
      measurementUnit: PropTypes.string.isRequired,
      measurementValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      expectedMeasurementValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      numberOfAvailableMeasurementValues: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
    })
  ).isRequired,

  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      measurementValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
    })
  ).isRequired,

  onDataChange: PropTypes.func.isRequired,
  onTableErrorChange: PropTypes.func,

  pagination: PropTypes.shape({
    current: PropTypes.number,
    pageSize: PropTypes.number,
    total: PropTypes.number,
  }),

  onPaginationChange: PropTypes.func,
  setPagination: PropTypes.func,
  readOnly: PropTypes.bool,
};

export default ExcelDataTable;
