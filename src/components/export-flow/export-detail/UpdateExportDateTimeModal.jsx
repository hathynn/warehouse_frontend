import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  DatePicker,
  TimePicker,
  Checkbox,
  Button,
  message,
  Spin,
} from "antd";
import dayjs from "dayjs";
import PropTypes from "prop-types";
import useConfigurationService from "@/hooks/useConfigurationService";
import { InfoCircleOutlined } from "@ant-design/icons";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
// Hàm getMinDateTime đã tối ưu như ở trên

function getMinDateTime(now, atLeast, workingTimeStart, workingTimeEnd) {
  const [atHour, atMin, atSec] = atLeast.split(":").map(Number);

  const startToday = now
    .clone()
    .hour(Number(workingTimeStart.split(":")[0]))
    .minute(Number(workingTimeStart.split(":")[1]))
    .second(Number(workingTimeStart.split(":")[2]))
    .millisecond(0);

  const endToday = now
    .clone()
    .hour(Number(workingTimeEnd.split(":")[0]))
    .minute(Number(workingTimeEnd.split(":")[1]))
    .second(Number(workingTimeEnd.split(":")[2]))
    .millisecond(0);

  // Nếu bây giờ đang trong giờ hành chính → cộng thời gian chờ ngay
  if (now.isSameOrAfter(startToday) && now.isBefore(endToday)) {
    const minCandidate = now
      .clone()
      .add(atHour, "hour")
      .add(atMin, "minute")
      .add(atSec, "second");

    // Nếu vẫn còn trong giờ hành chính sau cộng → giữ lại
    if (minCandidate.isSameOrBefore(endToday)) {
      return minCandidate;
    }
  }

  // Nếu đang trước giờ hành chính → bắt đầu từ giờ bắt đầu hôm nay + thời gian chờ
  if (now.isBefore(startToday)) {
    return startToday
      .clone()
      .add(atHour, "hour")
      .add(atMin, "minute")
      .add(atSec, "second");
  }

  // Nếu đang sau giờ hành chính → bắt đầu từ ngày mai
  const startTomorrow = startToday.clone().add(1, "day");

  return startTomorrow
    .add(atHour, "hour")
    .add(atMin, "minute")
    .add(atSec, "second");
}

function isTimeInWorkingHours(
  dateObj,
  timeObj,
  workingTimeStart,
  workingTimeEnd
) {
  if (!dateObj || !timeObj) return false;
  // Đúng:
  const pickedTime = dayjs(
    dateObj.format("YYYY-MM-DD") + " " + timeObj.format("HH:mm:ss")
  );
  const start = dayjs(dateObj.format("YYYY-MM-DD") + " " + workingTimeStart);
  const end = dayjs(dateObj.format("YYYY-MM-DD") + " " + workingTimeEnd);
  return pickedTime.isSameOrAfter(start) && pickedTime.isSameOrBefore(end);
}

const UpdateExportDateTimeModal = ({
  open,
  onCancel,
  onSuccess,
  exportRequest,
  updateExportDateTime,
  updateExportRequestStatus,
  loading,
}) => {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [configuration, setConfiguration] = useState(null);
  const [minDateTime, setMinDateTime] = useState(null);
  const [now, setNow] = useState(dayjs());
  const intervalRef = useRef();

  const { getConfiguration } = useConfigurationService();

  // Lấy config khi mở modal
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const conf = await getConfiguration();
        setConfiguration(conf);
      } catch (e) {
        //đã catch lỗi ở hook
      }
    })();
  }, [open]);

  // Tạo timer cập nhật now mỗi 1s
  useEffect(() => {
    if (!open) return;
    intervalRef.current = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(intervalRef.current);
  }, [open]);

  // Tính minDateTime mỗi khi now hoặc config đổi
  useEffect(() => {
    if (!configuration) return;
    const minDT = getMinDateTime(
      now,
      configuration.createRequestTimeAtLeast,
      configuration.workingTimeStart,
      configuration.workingTimeEnd
    );
    setMinDateTime(minDT);
  }, [now, configuration]);

  const handleOk = async () => {
    if (!date || !time) {
      message.warning("Vui lòng nhập đủ ngày và giờ xuất.");
      return;
    }
    if (!configuration) {
      message.error("Không thể kiểm tra cấu hình hệ thống.");
      return;
    }
    const pickedDateTime = dayjs(
      date.format("YYYY-MM-DD") + " " + time.format("HH:mm:ss")
    );
    if (pickedDateTime.isBefore(minDateTime)) {
      message.error(
        "Ngày/giờ nhận hàng phải sau tối thiểu: " +
          minDateTime.format("DD/MM/YYYY HH:mm:ss")
      );
      return;
    }
    if (
      !isTimeInWorkingHours(
        date,
        time,
        configuration.workingTimeStart,
        configuration.workingTimeEnd
      )
    ) {
      message.error(
        "Giờ nhận hàng phải nằm trong giờ hành chính (" +
          configuration.workingTimeStart +
          " - " +
          configuration.workingTimeEnd +
          ")"
      );
      return;
    }

    setSubmitting(true);
    try {
      await updateExportDateTime(exportRequest.exportRequestId, {
        exportDate: date.format("YYYY-MM-DD"),
        exportTime: time.format("HH:mm:ss"),
      });
      await updateExportRequestStatus(
        exportRequest.exportRequestId,
        "WAITING_EXPORT"
      );
      message.success("Đã cập nhật ngày khách nhận hàng!");
      onSuccess && onSuccess();
    } catch (e) {
      //đã catch lỗi ở hook
    }
    setSubmitting(false);
  };

  const isValidDateTime = () => {
    if (!date || !time || !configuration || !minDateTime) return false;

    const pickedDateTime = dayjs(
      date.format("YYYY-MM-DD") + " " + time.format("HH:mm:ss")
    );

    const isAfterMin = pickedDateTime.isSameOrAfter(minDateTime);
    const inWorkingHours = isTimeInWorkingHours(
      date,
      time,
      configuration.workingTimeStart,
      configuration.workingTimeEnd
    );

    return isAfterMin && inWorkingHours;
  };

  function renderMinDateTimeNotice() {
    if (!configuration || !minDateTime) return null;

    const noticeStyle = { display: "flex", alignItems: "center", gap: 6 };

    // Chưa chọn đủ thông tin
    if (!date || !time) {
      return (
        <span style={{ ...noticeStyle, color: "#0958d9" }}>
          <InfoCircleOutlined style={{ fontSize: 16, color: "#1890ff" }} />
          <span>
            Ngày/giờ tối thiểu nhận hàng là:{" "}
            <b>{minDateTime.format("DD/MM/YYYY HH:mm:ss")}</b> (trong giờ hành
            chính: {configuration.workingTimeStart} -{" "}
            {configuration.workingTimeEnd})
          </span>
        </span>
      );
    }

    const pickedDateTime = dayjs(
      `${date.format("YYYY-MM-DD")} ${time.format("HH:mm:ss")}`
    );
    const workingStart = dayjs(
      `${date.format("YYYY-MM-DD")} ${configuration.workingTimeStart}`
    );
    const workingEnd = dayjs(
      `${date.format("YYYY-MM-DD")} ${configuration.workingTimeEnd}`
    );

    // Kiểm tra trước minDateTime
    if (pickedDateTime.isBefore(minDateTime)) {
      return (
        <span style={{ color: "red", ...noticeStyle }}>
          <InfoCircleOutlined style={{ fontSize: 16 }} />
          <b>
            Ngày/giờ bạn chọn phải sau tối thiểu{" "}
            {minDateTime.format("DD/MM/YYYY HH:mm:ss")}
          </b>
        </span>
      );
    }

    // Kiểm tra ngoài giờ hành chính
    if (
      pickedDateTime.isBefore(workingStart) ||
      pickedDateTime.isAfter(workingEnd)
    ) {
      return (
        <span style={{ color: "red", ...noticeStyle }}>
          <InfoCircleOutlined style={{ fontSize: 16 }} />
          <b>
            Giờ bạn chọn phải nằm trong giờ hành chính (
            {configuration.workingTimeStart} - {configuration.workingTimeEnd})
          </b>
        </span>
      );
    }

    // Hợp lệ
    return (
      <span style={{ color: "black", ...noticeStyle }}>
        <InfoCircleOutlined style={{ fontSize: 16 }} />
        <b>Ngày/giờ bạn chọn đã hợp lệ </b>
      </span>
    );
  }

  return (
    <>
      <style>
        {`
          .ant-checkbox-inner {
            border-width: 0.5px !important;
            border-color: grey !important;
          }
        `}
      </style>
      <Modal
        open={open}
        title={
          <span style={{ fontWeight: 700, fontSize: 18 }}>
            Xác nhận ngày khách nhận hàng
          </span>
        }
        onCancel={onCancel}
        footer={[
          <Button key="back" onClick={onCancel}>
            Quay lại
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!confirmed || !date || !time || !configuration}
            loading={submitting || loading}
            onClick={handleOk}
          >
            Xác nhận
          </Button>,
        ]}
        width={480}
        centered
        destroyOnClose
      >
        {!configuration || !minDateTime ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="mb-2">
              <div>
                <b>Phiếu xuất:</b> #{exportRequest.exportRequestId}
              </div>
              <div>
                <b>Loại xuất:</b>{" "}
                {exportRequest.type === "PRODUCTION"
                  ? "Xuất sản xuất"
                  : "Xuất mượn"}
              </div>
            </div>
            <div className="mb-3">
              <label>
                <b>Ngày khách nhận hàng:</b>
              </label>
              <DatePicker
                value={date}
                onChange={setDate}
                style={{ width: "100%", marginTop: 6 }}
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                disabledDate={(current) =>
                  current && current.isBefore(minDateTime.startOf("day"), "day")
                }
              />
            </div>
            <div className="mb-3">
              <label>
                <b>Giờ khách nhận hàng:</b>
              </label>
              <TimePicker
                value={time}
                onChange={setTime}
                style={{ width: "100%", marginTop: 6 }}
                placeholder="Chọn giờ"
                format="HH:mm:ss"
                minuteStep={5}
              />
            </div>
            <div style={{ fontSize: 13, marginBottom: 12 }}>
              {renderMinDateTimeNotice()}
            </div>
            <div className="mb-2">
              <Checkbox
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={!isValidDateTime()}
              >
                Tôi đã liên hệ với khách hàng và xác nhận ngày nhận hàng đã nhập
                là đúng.
              </Checkbox>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

UpdateExportDateTimeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  exportRequest: PropTypes.shape({
    exportRequestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
  updateExportDateTime: PropTypes.func.isRequired,
  updateExportRequestStatus: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default UpdateExportDateTimeModal;
