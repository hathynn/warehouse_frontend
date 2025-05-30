import React, { useEffect, useState } from "react";
import { Input, DatePicker } from "antd";
import moment from "moment";
import PropTypes from "prop-types";
import useConfigurationService from "@/services/useConfigurationService";

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

  // Kiểm tra giờ nhận
  const checkTimeValid = (dateString, timeString) => {
    if (!dateString || !timeString) {
      setTimeError("");
      return;
    }

    const selected = moment(
      `${dateString} ${timeString}`,
      "YYYY-MM-DD HH:mm:ss"
    );
    const now = moment();

    const diff = selected.diff(now, "hours", true);

    // Parse số giờ từ config
    const parseHoursFromTimeString = (timeStr) => {
      if (!timeStr) return 0;
      const [h, m, s] = timeStr.split(":").map(Number);
      return h + m / 60 + s / 3600;
    };

    const requiredDiff = config
      ? parseHoursFromTimeString(config.createRequestTimeAtLeast)
      : 6;

    if (diff < requiredDiff) {
      setTimeError(
        `Thời gian nhận phải lớn hơn thời điểm hiện tại ít nhất ${requiredDiff} giờ`
      );
    } else {
      setTimeError("");
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
    if (!config) return false;

    // Ngày trong quá khứ thì disable
    if (current && current < moment().startOf("day")) {
      return true;
    }

    // Lấy thời gian cấu hình
    const workingTimeStart = config.workingTimeStart || "07:00:00";
    const workingTimeEnd = config.workingTimeEnd || "17:00:00";
    const createRequestTimeAtLeast =
      config.createRequestTimeAtLeast || "06:00:00";

    // Thời điểm hiện tại
    const now = moment();

    // Nếu ngày đang xét là hôm nay
    if (current && current.isSame(now, "day")) {
      // Tính thời điểm bắt đầu giờ làm + số giờ tạo request tối thiểu
      const [startHour, startMin] = workingTimeStart.split(":").map(Number);
      const [endHour, endMin] = workingTimeEnd.split(":").map(Number);

      // Thời điểm bắt đầu và kết thúc giờ làm việc hôm nay
      const workStart = moment(current)
        .hour(startHour)
        .minute(startMin)
        .second(0);
      const workEnd = moment(current).hour(endHour).minute(endMin).second(0);

      // Nếu bây giờ đã qua giờ làm thì disable hôm nay
      if (now.isAfter(workEnd)) return true;

      // Tính thời gian tối thiểu phải cộng
      const [minHour, minMin] = createRequestTimeAtLeast.split(":").map(Number);
      const minRequestMillis = (minHour * 60 + minMin) * 60 * 1000;

      // Nếu thời gian còn lại hôm nay < minRequestMillis => disable hôm nay
      if (workEnd.diff(now) < minRequestMillis) return true;

      // Nếu vẫn còn thời gian trong giờ làm việc và đủ số giờ thì không disable
      return false;
    }

    // Các ngày trước hôm nay đã bị loại ở trên, còn ngày sau hôm nay thì không disable
    return false;
  };

  function getEarliestAvailableMoment({
    now,
    workingTimeStart,
    workingTimeEnd,
    createRequestTimeAtLeast,
  }) {
    let [startHour, startMin] = workingTimeStart.split(":").map(Number);
    let [endHour, endMin] = workingTimeEnd.split(":").map(Number);
    let [minHour, minMin, minSec] = createRequestTimeAtLeast
      .split(":")
      .map(Number);

    let waitingMinutes = minHour * 60 + minMin + Math.ceil(minSec / 60);

    let current = moment(now); // clone để không làm thay đổi "now"
    while (waitingMinutes > 0) {
      // Working time block hôm nay
      let dayStart = current.clone().hour(startHour).minute(startMin).second(0);
      let dayEnd = current.clone().hour(endHour).minute(endMin).second(0);

      if (current.isBefore(dayStart)) {
        // Chưa tới giờ làm việc -> nhảy tới đầu giờ làm việc
        current = dayStart.clone();
      }

      if (current.isSameOrAfter(dayEnd)) {
        // Qua giờ làm việc -> sang ngày sau
        current = dayStart.clone().add(1, "day");
        continue;
      }

      // Còn bao nhiêu phút tới hết giờ làm việc
      let available = dayEnd.diff(current, "minutes");
      let use = Math.min(waitingMinutes, available);
      current = current.clone().add(use, "minutes");
      waitingMinutes -= use;
    }

    return current;
  }

  const getDisabledTime = (selectedDate) => {
    if (!config || !selectedDate) return {};

    const workingTimeStart = config.workingTimeStart || "07:00:00";
    const workingTimeEnd = config.workingTimeEnd || "17:00:00";
    const createRequestTimeAtLeast =
      config.createRequestTimeAtLeast || "06:00:00";

    const now = moment();

    // Tính earliestMoment:
    const earliestMoment = getEarliestAvailableMoment({
      now,
      workingTimeStart,
      workingTimeEnd,
      createRequestTimeAtLeast,
    });

    const selectedDay = moment(selectedDate).format("YYYY-MM-DD");
    const earliestDay = earliestMoment.format("YYYY-MM-DD");

    let [startHour, startMin] = workingTimeStart.split(":").map(Number);
    let [endHour, endMin] = workingTimeEnd.split(":").map(Number);

    if (selectedDay < earliestDay) {
      // Disable hết
      return {
        disabledHours: () => Array.from({ length: 24 }, (_, i) => i),
        disabledMinutes: () => Array.from({ length: 60 }, (_, i) => i),
      };
    }

    if (selectedDay > earliestDay) {
      // Chỉ block ngoài working time
      return {
        disabledHours: () => {
          let arr = [];
          for (let h = 0; h < 24; ++h) {
            if (h < startHour || h > endHour) arr.push(h);
            else if (h === endHour && endMin === 0) arr.push(h); // nếu kết thúc đúng giờ
          }
          return arr;
        },
        disabledMinutes: () => [],
      };
    }

    // Nếu là ngày earliestMoment:
    const earliestHour = earliestMoment.hour();
    const earliestMinute = earliestMoment.minute();

    return {
      disabledHours: () => {
        let arr = [];
        for (let h = 0; h < 24; ++h) {
          if (h < earliestHour || h < startHour || h > endHour) arr.push(h);
        }
        return arr;
      },
      disabledMinutes: (selectedHour) => {
        if (selectedHour === earliestHour) {
          return Array.from({ length: 60 }, (_, i) => i).filter(
            (i) => i < earliestMinute
          );
        }
        return [];
      },
    };
  };

  // const getDisabledTime = (selectedDate) => {
  //   if (!config) return {};

  //   const workingTimeStart = config.workingTimeStart || "07:00:00";
  //   const workingTimeEnd = config.workingTimeEnd || "17:00:00";
  //   const createRequestTimeAtLeast =
  //     config.createRequestTimeAtLeast || "06:00:00";

  //   const [startHour] = workingTimeStart.split(":").map(Number);
  //   const [endHour] = workingTimeEnd.split(":").map(Number);
  //   const [minHour, minMin] = createRequestTimeAtLeast.split(":").map(Number);

  //   // Nếu chưa chọn ngày nhận thì return toàn bộ disable
  //   if (!selectedDate) return {};

  //   const today = moment().format("YYYY-MM-DD");
  //   const selected = moment(selectedDate).format("YYYY-MM-DD");

  //   // Sử dụng ref để lưu giờ earliest
  //   let earliestMoment = moment().add(minHour, "hours").add(minMin, "minutes");
  //   if (earliestMoment.isBefore(moment().hour(startHour).minute(0))) {
  //     earliestMoment = moment().hour(startHour).minute(0);
  //   }
  //   const currentHour = earliestMoment.hour();
  //   const currentMinute = earliestMoment.minute();

  //   if (selected === today) {
  //     return {
  //       disabledHours: () => {
  //         // Disable giờ nhỏ hơn giờ earliest, lớn hơn giờ kết thúc
  //         let arr = [];
  //         for (let h = 0; h < 24; ++h) {
  //           if (h < currentHour || h > endHour) arr.push(h);
  //         }
  //         return arr;
  //       },
  //       disabledMinutes: (selectedHour) => {
  //         // Nếu chọn đúng giờ earliest => disable phút nhỏ hơn (currentMinute + 5)
  //         if (selectedHour === currentHour) {
  //           let min = Math.ceil((currentMinute + 1) / 5) * 5; // làm tròn lên 5 phút
  //           return Array.from({ length: 60 }, (_, i) => i).filter(
  //             (i) => i < min
  //           );
  //         }
  //         // Nếu chọn giờ lớn hơn, enable hết phút
  //         return [];
  //       },
  //     };
  //   } else {
  //     // Ngày khác: chỉ cho giờ trong working time, enable toàn bộ phút
  //     return {
  //       disabledHours: () => {
  //         let arr = [];
  //         for (let h = 0; h < 24; ++h) {
  //           if (h < startHour || h > endHour) arr.push(h);
  //         }
  //         return arr;
  //       },
  //       disabledMinutes: () => [],
  //     };
  //   }
  // };

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
          <DatePicker
            picker="time"
            format="HH:mm"
            value={
              formData.exportTime ? moment(formData.exportTime, "HH:mm") : null
            }
            onChange={(time, timeString) => {
              setFormData({ ...formData, exportTime: timeString || null });
              setMandatoryError("");
              checkTimeValid(formData.exportDate, timeString);
            }}
            className="w-full"
            allowClear
            placeholder="Chọn thời gian nhận"
            disabled={!formData.exportDate} // disable nếu chưa chọn ngày
            disabledTime={() => getDisabledTime(formData.exportDate)}
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
