import React, { useState, useEffect } from "react";
import {
  Button,
  Space,
  Card,
  Typography,
  Steps,
  Input,
  DatePicker,
  ConfigProvider,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/es/date-picker/locale/vi_VN";
import holidaysData from "@/assets/data/holidays-2025.json";
import ExcelDataTable from "@/components/stock-check-flow/stock-check-create/ExcelDataTable";
import StockCheckRequestConfirmModal from "./StockCheckRequestConfirmModal";

const { Title } = Typography;

const StockCheckRequestInfoForm = ({
  formData,
  setFormData,
  data,
  mappedData,
  validationError,
  handleSubmit,
  setFileConfirmed,
  fileName,
  items,
  pagination,
  excelFormData,
  allPagesViewed,
  hasTableError,
}) => {
  const [mandatoryError, setMandatoryError] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [tablePagination, setTablePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Update table pagination when mappedData changes
  useEffect(() => {
    setTablePagination((prev) => ({
      ...prev,
      total: mappedData.length,
      current: 1,
    }));
  }, [mappedData.length]);

  // Auto-fill form data from Excel
  useEffect(() => {
    if (excelFormData && !hasAutoFilled) {
      setFormData((prev) => ({
        ...prev,
        stockCheckReason:
          excelFormData.stockCheckReason || prev.stockCheckReason || "",
      }));
      setHasAutoFilled(true);
    }
  }, [excelFormData, hasAutoFilled, setFormData]);

  // Load holidays data
  useEffect(() => {
    try {
      const allBlockedDates = [
        ...holidaysData.fixedHolidays.map((h) => h.date),
        ...holidaysData.lunarHolidays.map((h) => h.date),
        ...holidaysData.sundays,
      ];
      setBlockedDates(allBlockedDates);
    } catch (error) {
      console.error("Error loading holidays data:", error);
    }
  }, []);

  const handleTablePaginationChange = (paginationInfo) => {
    setTablePagination((prev) => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize || prev.pageSize,
    }));
  };

  const isDateBlocked = (date) => {
    const dateString = dayjs(date).format("YYYY-MM-DD");
    return blockedDates.includes(dateString);
  };

  const getDisabledDateForStartDate = (current) => {
    if (!current) return false;

    // Disable past dates and blocked dates
    return current.isBefore(dayjs().startOf("day")) || isDateBlocked(current);
  };

  const getDisabledDateForExpectedDate = (current) => {
    if (!current) return false;

    // Disable dates before start date + 1 day and blocked dates
    const startDate = formData.startDate ? dayjs(formData.startDate) : dayjs();
    const minExpectedDate = startDate.add(1, "day"); // Thêm 1 ngày

    return (
      current.isBefore(minExpectedDate.startOf("day")) || isDateBlocked(current)
    );
  };

  const handleReasonChange = (e) => {
    const value = e.target.value;
    if (value.length <= 150) {
      setFormData({ ...formData, stockCheckReason: value });
      setMandatoryError("");
    }
  };

  const handleNoteChange = (e) => {
    const value = e.target.value;
    if (value.length <= 150) {
      setFormData({ ...formData, note: value });
    }
  };

  const handleConfirmModalOk = async () => {
    setConfirmLoading(true);
    await handleSubmit();
    setConfirmLoading(false);
    setShowConfirmModal(false);
  };

  const missingFields =
    !formData.startDate ||
    !formData.expectedCompletedDate ||
    !formData.stockCheckReason;

  const onSubmit = async () => {
    if (missingFields) {
      setMandatoryError("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }
    setMandatoryError("");
    setShowConfirmModal(true);
  };

  return (
    <div className="container mx-auto p-5">
      <div className="flex items-center mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => setFileConfirmed(false)}
          className="mr-4"
        >
          Quay lại
        </Button>
      </div>

      <div className="w-2/3 mx-auto">
        <Steps
          className="!mb-4"
          current={1}
          onChange={(clickedStep) => {
            if (clickedStep === 0) {
              setFileConfirmed(false);
            }
          }}
          items={[
            {
              title: (
                <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                  Tải lên file Excel
                </span>
              ),
            },
            {
              title: (
                <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                  Xác nhận thông tin
                </span>
              ),
            },
          ]}
        />
      </div>

      <div className="flex justify-between items-center mb-4">
        <Title level={3}>Điền thông tin phiếu kiểm kho</Title>
        <Space>
          <b>File đã được tải lên:</b> {fileName}
        </Space>
      </div>

      <div className="flex gap-6">
        <Card title="Thông tin phiếu kiểm kho" className="w-1/3">
          <Space direction="vertical" className="w-full">
            {/* Loại kiểm kho */}
            <span className="font-semibold">
              Loại kiểm kho: Kiểm kê theo yêu cầu
            </span>
            <div className="mb-2"></div>

            {/* Hiển thị thông báo nếu data được load từ Excel */}
            {excelFormData && (
              <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                ✓ Thông tin đã được tự động điền từ file Excel
              </div>
            )}

            {/* Ngày bắt đầu kiểm kê và Dự kiến ngày hoàn tất */}
            <div className="mb-4 flex gap-4">
              {/* Ngày bắt đầu kiểm kê */}
              <div className="w-1/2">
                <label className="block mb-1">
                  Ngày bắt đầu kiểm kê <span className="text-red-500">*</span>
                </label>
                <ConfigProvider>
                  <div dir="rtl">
                    <DatePicker
                      locale={locale}
                      format="DD-MM-YYYY"
                      size="large"
                      value={
                        formData.startDate ? dayjs(formData.startDate) : null
                      }
                      onChange={(date) => {
                        const newDate = date?.isValid()
                          ? date.format("YYYY-MM-DD")
                          : null;
                        setFormData({
                          ...formData,
                          startDate: newDate,
                          // Reset expected date if start date changes
                          expectedCompletedDate: null,
                        });
                        setMandatoryError("");
                      }}
                      className="w-full !mt-1 !p-[4px_8px]"
                      allowClear
                      placeholder="Chọn ngày bắt đầu"
                      disabledDate={getDisabledDateForStartDate}
                    />
                  </div>
                </ConfigProvider>
                {!formData.startDate && (
                  <div className="text-red-500 text-xs mt-1">
                    Chọn ngày bắt đầu kiểm kê.
                  </div>
                )}
              </div>

              {/* Dự kiến ngày hoàn tất */}
              <div className="w-1/2">
                <label className="block mb-1">
                  Ngày dự kiến xong <span className="text-red-500">*</span>
                </label>
                <ConfigProvider>
                  <div dir="rtl">
                    <DatePicker
                      locale={locale}
                      format="DD-MM-YYYY"
                      size="large"
                      value={
                        formData.expectedCompletedDate
                          ? dayjs(formData.expectedCompletedDate)
                          : null
                      }
                      onChange={(date) => {
                        const newDate = date?.isValid()
                          ? date.format("YYYY-MM-DD")
                          : null;
                        setFormData({
                          ...formData,
                          expectedCompletedDate: newDate,
                        });
                        setMandatoryError("");
                      }}
                      className="w-full !mt-1 !p-[4px_8px]"
                      allowClear
                      placeholder="Chọn ngày hoàn tất"
                      disabledDate={getDisabledDateForExpectedDate}
                      disabled={!formData.startDate}
                    />
                  </div>
                </ConfigProvider>
                {!formData.expectedCompletedDate && (
                  <div className="text-red-500 text-xs mt-1">
                    Chọn ngày mong muốn hoàn tất.
                  </div>
                )}
              </div>
            </div>

            {/* Lý do cần kiểm kê */}
            <div className="mb-4">
              <label className="block mb-1">
                Lý do cần kiểm kê <span className="text-red-500">*</span>
                {excelFormData?.stockCheckReason && (
                  <span className="text-blue-500 text-xs ml-1">(từ Excel)</span>
                )}
              </label>
              <Input.TextArea
                value={formData.stockCheckReason || ""}
                placeholder="Nhập lý do cần kiểm kê"
                maxLength={150}
                rows={2}
                onChange={handleReasonChange}
                className="w-full"
                showCount
              />
              {!formData.stockCheckReason && (
                <div className="text-red-500 text-xs mt-1">
                  Vui lòng nhập lý do cần kiểm kê.
                </div>
              )}
            </div>

            {/* Ghi chú */}
            <div className="mb-4">
              <label className="block mb-1">Ghi chú</label>
              <Input.TextArea
                value={formData.note || ""}
                placeholder="Nhập ghi chú (không bắt buộc)"
                maxLength={150}
                rows={2}
                onChange={handleNoteChange}
                className="w-full"
                showCount
              />
            </div>

            {mandatoryError && (
              <div className="text-red-500 text-sm mb-2">{mandatoryError}</div>
            )}

            <Button
              type="primary"
              onClick={onSubmit}
              className="w-full mt-4"
              loading={confirmLoading}
              disabled={
                data.length === 0 ||
                !!validationError ||
                missingFields ||
                hasTableError
              }
            >
              Xác nhận tạo phiếu kiểm kho
            </Button>
          </Space>
        </Card>

        <div className="w-2/3">
          <Card title="Chi tiết hàng hóa từ file Excel">
            {mappedData.length > 0 ? (
              <ExcelDataTable
                data={mappedData}
                items={items}
                onDataChange={() => {}} // Không cho chỉnh sửa
                onTableErrorChange={() => {}}
                pagination={tablePagination}
                onPaginationChange={handleTablePaginationChange}
                setPagination={setTablePagination}
                onRemovedItemsNotification={() => {}}
              />
            ) : (
              <div className="text-center py-10 text-gray-500">
                Vui lòng tải lên file Excel để xem chi tiết hàng hóa
              </div>
            )}
          </Card>
        </div>
      </div>
      <StockCheckRequestConfirmModal
        open={showConfirmModal}
        onOk={handleConfirmModalOk}
        onCancel={() => setShowConfirmModal(false)}
        confirmLoading={confirmLoading}
        formData={formData}
        details={mappedData}
        items={items}
      />
    </div>
  );
};

StockCheckRequestInfoForm.propTypes = {
  formData: PropTypes.shape({
    startDate: PropTypes.string,
    expectedCompletedDate: PropTypes.string,
    stockCheckReason: PropTypes.string,
    note: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  data: PropTypes.array.isRequired,
  mappedData: PropTypes.array.isRequired,
  validationError: PropTypes.string,
  handleSubmit: PropTypes.func.isRequired,
  setFileConfirmed: PropTypes.func.isRequired,
  fileName: PropTypes.string.isRequired,
  items: PropTypes.array,
  pagination: PropTypes.object,
  excelFormData: PropTypes.object,
  allPagesViewed: PropTypes.bool,
  hasTableError: PropTypes.bool,
};

export default StockCheckRequestInfoForm;
