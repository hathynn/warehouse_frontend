import dayjs, { Dayjs } from "dayjs";
import { ConfigurationDto } from "../hooks/useConfigurationService";

// Define action types for better type safety and maintainability
export type ActionType = 'create-import-order' | 'assign-staff' | 'confirm-import-order' | 'cancel-import-order' | 'extend-import-order';

// Helper to get the appropriate configuration value based on action type
const getConfigurationValue = (
    actionType: ActionType,
    configuration: ConfigurationDto | null
): { value: string | number; unit: 'hour' | 'day' } => {
    if (!configuration) {
        throw new Error('Configuration is required');
    }

    switch (actionType) {
        case 'create-import-order':
            return { value: configuration.createRequestTimeAtLeast, unit: 'hour' };
        case 'assign-staff':
            return { value: configuration.timeToAllowAssign, unit: 'hour' };
        case 'confirm-import-order':
            return { value: configuration.timeToAllowConfirm, unit: 'hour' };
        case 'cancel-import-order':
            return { value: configuration.timeToAllowCancel, unit: 'hour' };
        case 'extend-import-order':
            return { value: configuration.daysToAllowExtend, unit: 'day' };
        default:
            throw new Error(`Unsupported action type: ${actionType}`);
    }
};

// Helper to get minimum datetime for a specific action
const getMinimumDateTimeForAction = (
    actionType: ActionType,
    configuration: ConfigurationDto | null
): Dayjs => {
    const now = dayjs();
    const { value, unit } = getConfigurationValue(actionType, configuration);
    
    if (unit === 'hour') {
        const hours = parseInt(value.toString().split(':')[0]!);
        return now.add(hours, 'hour');
    } else {
        // For days (extend action)
        return now.add(Number(value), 'day');
    }
};

// Helper to validate if selected datetime is valid based on configuration and action type
export const validateDateTime = (
    date: string,
    time: string,
    actionType: ActionType,
    configuration: ConfigurationDto | null
): boolean => {
    if (!configuration) return false;
    
    const selectedDateTime = dayjs(`${date} ${time}`);
    const minDateTime = getMinimumDateTimeForAction(actionType, configuration);
    return selectedDateTime.isAfter(minDateTime);
};

// Helper to get default datetime based on configuration and action type
export const getDefaultAssignedDateTimeForAction = (
    actionType: ActionType,
    configuration: ConfigurationDto | null
) => {
    if (!configuration) {
        throw new Error('Configuration is required');
    }

    const now = dayjs();
    const { value, unit } = getConfigurationValue(actionType, configuration);
    
    let defaultTime: Dayjs;
    
    if (unit === 'hour') {
        const hours = parseInt(value.toString().split(':')[0]!);
        defaultTime = now.add(hours, 'hour').add(30, 'minute');
    } else {
        // For days (extend action)
        defaultTime = now.add(Number(value), 'day');
    }
    
    return {
        date: defaultTime.format("YYYY-MM-DD"),
        time: defaultTime.format("HH:mm")
    };
};

// Helper to determine if a date should be disabled based on action type
export const isDateDisabledForAction = (
    current: Dayjs,
    actionType: ActionType,
    configuration: ConfigurationDto | null
): boolean => {
    if (!configuration) return true;
    
    const minDateTime = getMinimumDateTimeForAction(actionType, configuration);
    return current && current.isBefore(minDateTime.startOf('day'));
};

// Helper to get disabled time settings for TimePicker based on action type
export const getDisabledTimeConfigForAction = (
    selectedDate: string,
    actionType: ActionType,
    configuration: ConfigurationDto | null
) => {
    if (!configuration) return {};
    
    const now = dayjs();
    const selectedDateObj = dayjs(selectedDate);
    const minDateTime = getMinimumDateTimeForAction(actionType, configuration);

    // Only apply time restrictions for hour-based configurations
    const { unit } = getConfigurationValue(actionType, configuration);
    
    if (unit === 'hour' && selectedDateObj.isSame(minDateTime, 'day')) {
        return {
            disabledHours: () => Array.from({ length: minDateTime.hour() }, (_, i) => i),
            disabledMinutes: (selectedHour: number) => {
                if (selectedHour === minDateTime.hour()) {
                    return Array.from({ length: minDateTime.minute() }, (_, i) => i);
                }
                return [];
            }
        };
    }
    
    return {};
};