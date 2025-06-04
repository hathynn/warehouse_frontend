import React, { useEffect, useState, useMemo } from "react";
import { Input, DatePicker, TimePicker } from "antd";
import PropTypes from "prop-types";
import useConfigurationService from "@/services/useConfigurationService";
import dayjs from "dayjs";

const UseExportForm = ({
  formData,
  setFormData,
  openDepartmentModal,
  timeError,
  setTimeError,
  mandatoryError,
  setMandatoryError,
}) => {
  const [config, setConfig] = useState(null);
  const { getConfiguration } = useConfigurationService();

  useEffect(() => {
    const fetchConfig = async () => {
      const result = await getConfiguration();
      setConfig(result);
    };
    fetchConfig();
  }, []);

  const dateObj = formData.exportDate
    ? dayjs(formData.exportDate, "YYYY-MM-DD")
    : null;

  // Kiểm tra giờ nhận
  const checkTimeValid = (dateString, timeString) => {
    if (!dateString || !timeString || !config) {
      setTimeError("");
      return;
    }

    try {
      const selected = dayjs(`${dateString} ${timeString}`, "YYYY-MM-DD HH:mm");
      const now = dayjs();

      if (!selected.isValid()) {
        setTimeError("Thời gian không hợp lệ");
        return;
      }

      const diff = selected.diff(now, "hours", true);

      const parseHoursFromTimeString = (timeStr) => {
        if (!timeStr) return 0;
        const parts = timeStr.split(":");
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]) || 0;
        const s = parseInt(parts[2]) || 0;
        return h + m / 60 + s / 3600;
      };

      const requiredDiff = parseHoursFromTimeString(
        config.createRequestTimeAtLeast || "06:00:00"
      );

      if (diff < requiredDiff) {
        setTimeError(
          `Thời gian nhận phải lớn hơn thời điểm hiện tại ít nhất ${requiredDiff} giờ`
        );
      } else {
        setTimeError("");
      }
    } catch (error) {
      console.error("Error in checkTimeValid:", error);
      setTimeError("Có lỗi xảy ra khi kiểm tra thời gian");
    }
  };

  // Chặn nhập quá 150 ký tự
  const handleReasonChange = (e) => {
    const value = e.target.value;
    if (value.length <= 150) {
      setFormData({ ...formData, exportReason: value });
      setMandatoryError(""); // clear lỗi khi bắt đầu nhập
    }
  };

  const getDisabledDate = (current) => {
    if (!config || !current) return false;

    // Không cho chọn ngày trong quá khứ
    if (current.isBefore(dayjs().startOf("day"))) {
      return true;
    }

    const workingTimeStart = config.workingTimeStart || "07:00:00";
    const workingTimeEnd = config.workingTimeEnd || "17:00:00";
    const createRequestTimeAtLeast =
      config.createRequestTimeAtLeast || "06:00:00";

    const now = dayjs();

    // Kiểm tra ngày hôm nay
    if (current.isSame(now, "day")) {
      try {
        const [endHour, endMin] = workingTimeStart
          .split(":")
          .map((h) => parseInt(h) || 0);
        const workEnd = current.hour(endHour).minute(endMin).second(0);

        if (now.isAfter(workEnd)) return true;

        const [minHour, minMin] = createRequestTimeAtLeast
          .split(":")
          .map((h) => parseInt(h) || 0);
        const minRequestMillis = (minHour * 60 + minMin) * 60 * 1000;

        if (workEnd.diff(now) < minRequestMillis) return true;
      } catch (error) {
        console.error("Error in getDisabledDate:", error);
        return false;
      }
    }

    return false;
  };

  // Tối ưu hóa hàm getEarliestAvailableMoment
  const getEarliestAvailableMoment = useMemo(() => {
    return ({
      now,
      workingTimeStart,
      workingTimeEnd,
      createRequestTimeAtLeast,
    }) => {
      try {
        const [startHour, startMin] = workingTimeStart
          .split(":")
          .map((h) => parseInt(h) || 0);
        const [endHour, endMin] = workingTimeEnd
          .split(":")
          .map((h) => parseInt(h) || 0);
        const [minHour, minMin, minSec] = createRequestTimeAtLeast
          .split(":")
          .map((h) => parseInt(h) || 0);

        let waitingMinutes =
          minHour * 60 + minMin + Math.ceil((minSec || 0) / 60);
        let current = now.clone();
        let iterations = 0;
        const maxIterations = 100; // Tránh infinite loop

        while (waitingMinutes > 0 && iterations < maxIterations) {
          iterations++;

          const dayStart = current.hour(startHour).minute(startMin).second(0);
          const dayEnd = current.hour(endHour).minute(endMin).second(0);

          if (current.isBefore(dayStart)) {
            current = dayStart;
          }

          if (current.isSameOrAfter(dayEnd)) {
            current = dayStart.add(1, "day");
            continue;
          }

          const available = dayEnd.diff(current, "minutes");
          if (available <= 0) {
            current = dayStart.add(1, "day");
            continue;
          }

          const use = Math.min(waitingMinutes, available);
          current = current.add(use, "minutes");
          waitingMinutes -= use;
        }

        return current;
      } catch (error) {
        console.error("Error in getEarliestAvailableMoment:", error);
        return now.add(6, "hours"); // Fallback
      }
    };
  }, []);

  // Tối ưu hóa disabledTime với useMemo
  const disabledTime = useMemo(() => {
    return () => {
      if (!config || !formData.exportDate) {
        return {
          disabledHours: () => [],
          disabledMinutes: () => [],
        };
      }

      try {
        const workingTimeStart = config.workingTimeStart || "07:00:00";
        const workingTimeEnd = config.workingTimeEnd || "17:00:00";
        const createRequestTimeAtLeast =
          config.createRequestTimeAtLeast || "06:00:00";

        const earliestMoment = getEarliestAvailableMoment({
          now: dayjs(),
          workingTimeStart,
          workingTimeEnd,
          createRequestTimeAtLeast,
        });

        const selectedDay = dayjs(formData.exportDate, "YYYY-MM-DD");

        if (!selectedDay.isValid() || !earliestMoment.isValid()) {
          return {
            disabledHours: () => [],
            disabledMinutes: () => [],
          };
        }

        const earliestDay = earliestMoment.startOf("day");

        const [startHour, startMin] = workingTimeStart
          .split(":")
          .map((h) => parseInt(h) || 0);
        const [endHour, endMin] = workingTimeEnd
          .split(":")
          .map((h) => parseInt(h) || 0);

        // Ngày được chọn trước ngày có thể chọn sớm nhất
        if (selectedDay.isBefore(earliestDay, "day")) {
          return {
            disabledHours: () => Array.from({ length: 24 }, (_, i) => i),
            disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i),
          };
        }

        // Ngày được chọn sau ngày có thể chọn sớm nhất
        if (selectedDay.isAfter(earliestDay, "day")) {
          const disabledHours = [];
          for (let i = 0; i < 24; i++) {
            if (
              i < startHour ||
              i > endHour ||
              (i === endHour && endMin === 0)
            ) {
              disabledHours.push(i);
            }
          }
          return {
            disabledHours: () => disabledHours,
            disabledMinutes: () => [],
          };
        }

        // Cùng ngày với ngày có thể chọn sớm nhất
        const earliestHour = earliestMoment.hour();
        const earliestMinute = earliestMoment.minute();

        const disabledHours = [];
        for (let i = 0; i < 24; i++) {
          if (
            i < startHour ||
            i > endHour ||
            i < earliestHour ||
            (i === endHour && endMin === 0)
          ) {
            disabledHours.push(i);
          }
        }

        return {
          disabledHours: () => disabledHours,
          disabledMinutes: (selectedHour) => {
            if (selectedHour === earliestHour) {
              return Array.from({ length: earliestMinute }, (_, i) => i);
            }
            return [];
          },
        };
      } catch (error) {
        console.error("Error in disabledTime:", error);
        return {
          disabledHours: () => [],
          disabledMinutes: () => [],
        };
      }
    };
  }, [config, formData.exportDate, getEarliestAvailableMoment]);

  return (
    <>
      {/* Ngày nhận và Thời gian nhận */}
      <span className="font-semibold">Loại xuất: Sản Xuất</span>
      <div className="mb-2"></div>
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block mb-1">
            Ngày nhận <span className="text-red-500">*</span>
          </label>
          <DatePicker
            format="DD-MM-YYYY"
            value={formData.exportDate ? dayjs(formData.exportDate) : null}
            onChange={(date) => {
              const newDate = date?.isValid()
                ? date.format("YYYY-MM-DD")
                : null;
              setFormData({
                ...formData,
                exportDate: newDate,
                exportTime: null, // CLEAR GIỜ NHẬN khi đổi ngày!
              });
              setMandatoryError("");
              setTimeError(""); // reset luôn lỗi giờ nếu đổi ngày
            }}
            className="w-full"
            allowClear
            placeholder="Chọn ngày nhận"
            disabledDate={getDisabledDate}
          />
          {!formData.exportDate && (
            <div className="text-red-500 text-xs mt-1">
              Vui lòng chọn ngày nhận.
            </div>
          )}
        </div>
        <div className="flex-1">
          <label className="block mb-1">
            Thời gian nhận <span className="text-red-500">*</span>
          </label>
          <TimePicker
            format="HH:mm"
            value={
              formData.exportTime
                ? dayjs(`1970-01-01 ${formData.exportTime}`)
                : null
            }
            onChange={(time, timeString) => {
              setFormData({ ...formData, exportTime: timeString || null });
              setMandatoryError("");
              checkTimeValid(formData.exportDate, timeString);
            }}
            className="w-full"
            allowClear
            placeholder="Chọn thời gian nhận"
            disabled={!formData.exportDate}
            disabledTime={disabledTime}
            needConfirm={false}
          />

          {!formData.exportTime && (
            <div className="text-red-500 text-xs mt-1">
              Vui lòng chọn thời gian nhận.
            </div>
          )}
          {timeError && (
            <div className="text-red-500 text-xs mt-1">{timeError}</div>
          )}
        </div>
      </div>

      {/* Lý do xuất */}
      <div className="mb-4">
        <label className="block mb-1">
          Lý do xuất <span className="text-red-500">*</span>
        </label>
        <Input.TextArea
          value={formData.exportReason || ""}
          placeholder="Nhập lý do xuất"
          maxLength={150}
          rows={2}
          onChange={handleReasonChange}
          className="w-full"
          showCount
        />
        {!formData.exportReason && (
          <div className="text-red-500 text-xs mt-1">
            Vui lòng nhập lý do xuất.
          </div>
        )}
      </div>

      {/* Phòng ban: onClick mở modal */}
      <div className="mb-4">
        <label className="block mb-1">
          Phòng ban <span className="text-red-500">*</span>
        </label>
        <Input
          value={
            formData.receivingDepartment
              ? formData.receivingDepartment.name
              : ""
          }
          placeholder="Chọn phòng ban"
          readOnly
          onClick={openDepartmentModal}
          className="w-full cursor-pointer"
        />
        {!formData.receivingDepartment && (
          <div className="text-red-500 text-xs mt-1">
            Vui lòng chọn phòng ban.
          </div>
        )}
      </div>

      {/* Người đại diện phòng ban */}
      <div className="mb-4">
        <label className="block mb-1">Người đại diện phòng ban</label>
        <Input
          value={formData.departmentRepresentative || ""}
          placeholder="Tự động điền sau khi chọn phòng ban"
          readOnly
          className="w-full"
          style={{
            backgroundColor: "#cfcfcf",
            cursor: "not-allowed",
          }}
        />
      </div>

      {/* Số điện thoại người đại diện */}
      <div className="mb-4">
        <label className="block mb-1">Số điện thoại người đại diện</label>
        <Input
          value={formData.departmentRepresentativePhone || ""}
          placeholder="Tự động điền sau khi chọn phòng ban"
          readOnly
          className="w-full"
          style={{
            backgroundColor: "#cfcfcf",
            cursor: "not-allowed",
          }}
        />
      </div>
    </>
  );
};

UseExportForm.propTypes = {
  formData: PropTypes.shape({
    exportReason: PropTypes.string,
    exportDate: PropTypes.string,
    exportTime: PropTypes.string,
    receivingDepartment: PropTypes.object,
    departmentRepresentative: PropTypes.string,
    departmentRepresentativePhone: PropTypes.string,
    note: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  openDepartmentModal: PropTypes.func.isRequired,
  timeError: PropTypes.string,
  setTimeError: PropTypes.func,
  mandatoryError: PropTypes.string,
  setMandatoryError: PropTypes.func,
};

export default UseExportForm;
