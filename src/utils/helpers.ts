import dayjs, { Dayjs } from "dayjs";
import { ConfigurationDto } from "../hooks/useConfigurationService";
import { ImportRequestResponse } from "../hooks/useImportRequestService";

export type ActionType =
    | 'import-order-create'
    | 'assign-staff'
    | 'confirm-import-order'
    | 'cancel-import-order'
    | 'extend-import-order'
    | 'import-request-create';

interface TimeConfig {
    value: number;
    unit: 'hour' | 'day';
}

// Configuration mapping for simple actions (single config key)
const SIMPLE_ACTION_CONFIG_MAP: Record<Exclude<ActionType, 'import-order-create'>, keyof ConfigurationDto> = {
    'assign-staff': 'timeToAllowAssign',
    'confirm-import-order': 'timeToAllowConfirm',
    'cancel-import-order': 'timeToAllowCancel',
    'extend-import-order': 'daysToAllowExtend',
    'import-request-create': 'maxAllowedDaysForImportRequestProcess'
};

// Complex action configuration for import-order-create
interface ImportOrderCreateConfig {
    timeConfig: keyof ConfigurationDto;
    requiresImportRequest: true;
}

const COMPLEX_ACTION_CONFIG_MAP: Record<'import-order-create', ImportOrderCreateConfig> = {
    'import-order-create': {
        timeConfig: 'createRequestTimeAtLeast',
        requiresImportRequest: true
    }
};

// Actions that use hours vs days
const HOUR_BASED_ACTIONS: ActionType[] = [
    'import-order-create',
    'assign-staff',
    'confirm-import-order',
    'cancel-import-order'
];

const DAY_BASED_ACTIONS: ActionType[] = [
    'extend-import-order',
    'import-request-create'
];

/**
 * Get time configuration for an action type
 */
function getTimeConfig(actionType: ActionType, configuration: ConfigurationDto): TimeConfig {
    let configKey: keyof ConfigurationDto;
    
    if (actionType === 'import-order-create') {
        configKey = COMPLEX_ACTION_CONFIG_MAP[actionType].timeConfig;
    } else {
        configKey = SIMPLE_ACTION_CONFIG_MAP[actionType];
    }
    
    const value = configuration[configKey];

    if (value === undefined || value === null) {
        throw new Error(`Configuration value for ${actionType} is missing`);
    }

    const unit = HOUR_BASED_ACTIONS.includes(actionType) ? 'hour' : 'day';

    // For hour-based actions, extract hours from time string format (e.g., "2:00")
    if (unit === 'hour' && typeof value === 'string') {
        const hours = parseInt(value.split(':')[0] || '0');
        return { value: hours, unit };
    }

    return { value: Number(value), unit };
}

/**
 * Calculate minimum allowed datetime for an action
 */
export function getMinDateTime(
    actionType: ActionType,
    configuration: ConfigurationDto,
    baseDate: Dayjs = dayjs(),
    importRequest?: ImportRequestResponse
): Dayjs {
    const { value, unit } = getTimeConfig(actionType, configuration);

    if (unit === 'hour') {
        let minDateTime = baseDate.add(value, 'hour');
        
        // For import-order-create, also consider import request start date
        if (actionType === 'import-order-create' && importRequest?.startDate) {
            const importRequestStartDate = dayjs(importRequest.startDate).startOf('day');
            minDateTime = minDateTime.isAfter(importRequestStartDate) ? minDateTime : importRequestStartDate;
        }
        
        return minDateTime;
    }

    // For day-based actions
    if (actionType === 'import-request-create') {
        return baseDate.startOf('day');
    }

    return baseDate.add(value, 'day');
}

/**
 * Calculate maximum allowed datetime for an action (if applicable)
 */
function getMaxDateTime(
    actionType: ActionType,
    configuration: ConfigurationDto,
    baseDate: Dayjs = dayjs(),
    hasStartDate: boolean = false,
    importRequest?: ImportRequestResponse
): Dayjs | null {
    if ((actionType === 'import-request-create') && hasStartDate) {
        const { value } = getTimeConfig(actionType, configuration);
        return baseDate.add(value, 'day').endOf('day');
    }
    
    if (actionType === 'import-order-create' && importRequest?.endDate) {
        const importRequestEndDate = dayjs(importRequest.endDate).endOf('day');
        return importRequestEndDate;
    }

    return null;
}

/**
 * Validate if selected datetime is within allowed range
 */
export function validateDateTime(
    date: string,
    time: string,
    actionType: ActionType,
    configuration: ConfigurationDto | null,
    startDate?: string,
    importRequest?: ImportRequestResponse
): boolean {
    if (!configuration) return false;

    const selectedDateTime = dayjs(`${date} ${time}`);
    const baseDate = startDate ? dayjs(startDate) : dayjs();

    const minDateTime = getMinDateTime(actionType, configuration, baseDate, importRequest);
    const maxDateTime = getMaxDateTime(actionType, configuration, baseDate, !!startDate, importRequest);

    const isAfterMin = selectedDateTime.isAfter(minDateTime);
    const isBeforeMax = maxDateTime ? selectedDateTime.isBefore(maxDateTime) : true;

    return isAfterMin && isBeforeMax;
}

/**
 * Get default datetime for an action
 */
export function getDefaultAssignedDateTimeForAction(
    actionType: ActionType,
    configuration: ConfigurationDto | null,
    startDate?: string,
    importRequest?: ImportRequestResponse
) {
    if (!configuration) {
        throw new Error('Configuration is required');
    }

    const baseDate = startDate ? dayjs(startDate) : dayjs();
    const { value, unit } = getTimeConfig(actionType, configuration);

    let defaultDateTime: Dayjs;

    if (unit === 'hour') {
        // Add configured hours plus 30 minutes buffer
        defaultDateTime = baseDate.add(value, 'hour').add(30, 'minute');
        
        // For import-order-create, ensure it's not before import request start date
        if (actionType === 'import-order-create' && importRequest?.startDate) {
            const importRequestStartDate = dayjs(importRequest.startDate).startOf('day');
            if (defaultDateTime.isBefore(importRequestStartDate)) {
                defaultDateTime = importRequestStartDate.hour(9).minute(0); // Default to 9:00 AM on start date
            }
        }
    } else if (actionType === 'import-request-create') {
        defaultDateTime = baseDate;
    } else {
        defaultDateTime = baseDate.add(value, 'day');
    }

    return {
        date: defaultDateTime.format("YYYY-MM-DD"),
        time: defaultDateTime.format("HH:mm")
    };
}

/**
 * Check if a date should be disabled in date picker
 */
export function isDateDisabledForAction(
    current: Dayjs,
    actionType: ActionType,
    configuration: ConfigurationDto | null,
    startDate?: string,
    importRequest?: ImportRequestResponse
): boolean {
    if (!configuration || !current) return true;

    const baseDate = startDate ? dayjs(startDate) : dayjs();
    const minDateTime = getMinDateTime(actionType, configuration, baseDate, importRequest);
    const maxDateTime = getMaxDateTime(actionType, configuration, baseDate, !!startDate, importRequest);

    const isBeforeMin = current.isBefore(minDateTime.startOf('day'));
    const isAfterMax = maxDateTime ? current.isAfter(maxDateTime.startOf('day')) : false;

    return isBeforeMin || isAfterMax;
}

/**
 * Get disabled time configuration for time picker
 */
export function getDisabledTimeConfigForAction(
    selectedDate: string,
    actionType: ActionType,
    configuration: ConfigurationDto | null,
    startDate?: string,
    importRequest?: ImportRequestResponse
) {
    if (!configuration) return {};

    const selectedDateObj = dayjs(selectedDate);
    const baseDate = startDate ? dayjs(startDate) : dayjs();
    const minDateTime = getMinDateTime(actionType, configuration, baseDate, importRequest);
    const maxDateTime = getMaxDateTime(actionType, configuration, baseDate, !!startDate, importRequest);

    // Only apply time restrictions for hour-based actions on the minimum date
    const { unit } = getTimeConfig(actionType, configuration);

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

    // For import-order-create, also check max date time restrictions
    if (actionType === 'import-order-create' && maxDateTime && selectedDateObj.isSame(maxDateTime, 'day')) {
        return {
            disabledHours: () => {
                const hours = [];
                for (let i = maxDateTime.hour() + 1; i < 24; i++) {
                    hours.push(i);
                }
                return hours;
            },
            disabledMinutes: (selectedHour: number) => {
                if (selectedHour === maxDateTime.hour()) {
                    const minutes = [];
                    for (let i = maxDateTime.minute() + 1; i < 60; i++) {
                        minutes.push(i);
                    }
                    return minutes;
                }
                return [];
            }
        };
    }

    return {};
}