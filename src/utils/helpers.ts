import dayjs, { Dayjs } from "dayjs";
import { ConfigurationDto } from "../hooks/useConfigurationService";

export type ActionType =
    | 'create-import-order'
    | 'assign-staff'
    | 'confirm-import-order'
    | 'cancel-import-order'
    | 'extend-import-order'
    | 'import-request-create';

interface TimeConfig {
    value: number;
    unit: 'hour' | 'day';
}

// Configuration mapping for each action type
const ACTION_CONFIG_MAP: Record<ActionType, keyof ConfigurationDto> = {
    'create-import-order': 'createRequestTimeAtLeast',
    'assign-staff': 'timeToAllowAssign',
    'confirm-import-order': 'timeToAllowConfirm',
    'cancel-import-order': 'timeToAllowCancel',
    'extend-import-order': 'daysToAllowExtend',
    'import-request-create': 'maxAllowedDaysForImportRequestProcess'
};

// Actions that use hours vs days
const HOUR_BASED_ACTIONS: ActionType[] = [
    'create-import-order',
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
    const configKey = ACTION_CONFIG_MAP[actionType];
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
function getMinDateTime(
    actionType: ActionType,
    configuration: ConfigurationDto,
    baseDate: Dayjs = dayjs()
): Dayjs {
    const { value, unit } = getTimeConfig(actionType, configuration);

    if (unit === 'hour') {
        return baseDate.add(value, 'hour');
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
    hasStartDate: boolean = false
): Dayjs | null {
    if (actionType === 'import-request-create' && hasStartDate) {
        const { value } = getTimeConfig(actionType, configuration);
        return baseDate.add(value, 'day').endOf('day');
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
    startDate?: string
): boolean {
    if (!configuration) return false;

    const selectedDateTime = dayjs(`${date} ${time}`);
    const baseDate = startDate ? dayjs(startDate) : dayjs();

    const minDateTime = getMinDateTime(actionType, configuration, baseDate);
    const maxDateTime = getMaxDateTime(actionType, configuration, baseDate, !!startDate);

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
    startDate?: string
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
    startDate?: string
): boolean {
    if (!configuration || !current) return true;

    const baseDate = startDate ? dayjs(startDate) : dayjs();
    const minDateTime = getMinDateTime(actionType, configuration, baseDate);
    const maxDateTime = getMaxDateTime(actionType, configuration, baseDate, !!startDate);

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
    startDate?: string
) {
    if (!configuration) return {};

    const selectedDateObj = dayjs(selectedDate);
    const baseDate = startDate ? dayjs(startDate) : dayjs();
    const minDateTime = getMinDateTime(actionType, configuration, baseDate);

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

    return {};
}