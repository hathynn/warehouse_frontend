import dayjs, { Dayjs } from "dayjs";
import { ConfigurationDto } from "../services/useConfigurationService";
import { ImportRequestResponse } from "../services/useImportRequestService";
import { AccountRole } from '@/utils/enums';
import {
    PRIVATE_WAREHOUSE_MANAGER_CHANNEL,
    PRIVATE_DEPARTMENT_CHANNEL,
    PRIVATE_STAFF_CHANNEL,
    PRIVATE_ACCOUNTING_CHANNEL,
    PRIVATE_ADMIN_CHANNEL
} from '@/constants/channels-events';

/**
 * Defines the action types for import and request processing.
 */
export type ActionType =
    | 'import-order-create'
    | 'assign-staff'
    | 'confirm-import-order'
    | 'cancel-import-order'
    | 'extend-import-order'
    | 'import-request-create';

/**
 * Configuration for each action type, mapping to a key in ConfigurationDto,
 * the time unit for calculation, and any specific requirements.
 */
interface ActionConfig {
    configKey: keyof ConfigurationDto;
    unit: 'hour' | 'day';
    requiresImportRequest?: boolean;
}

/**
 * Central map linking each action to its configuration details.
 */
const ACTION_CONFIG_MAP: Record<ActionType, ActionConfig> = {
    'import-order-create': {
        configKey: 'createRequestTimeAtLeast',
        unit: 'hour',
        requiresImportRequest: true
    },
    'assign-staff': {
        configKey: 'timeToAllowAssign',
        unit: 'hour'
    },
    'confirm-import-order': {
        configKey: 'timeToAllowConfirm',
        unit: 'hour'
    },
    'cancel-import-order': {
        configKey: 'timeToAllowCancel',
        unit: 'hour'
    },
    'extend-import-order': {
        configKey: 'daysToAllowExtend',
        unit: 'day'
    },
    'import-request-create': {
        configKey: 'maxAllowedDaysForImportRequestProcess',
        unit: 'day'
    }
};

/**
 * Parses a raw configuration value into a numeric amount.
 *
 * @param rawValue - The raw value from configuration, e.g. '04:00' or 4.
 * @param unit - The unit to parse ('hour' or 'day').
 * @returns The numeric value representing hours or days.
 *
 * @example
 * parseTimeValue('03:30', 'hour'); // returns 3
 */
function parseTimeValue(rawValue: string | number, unit: 'hour' | 'day'): number {
    if (unit === 'hour') {
        if (typeof rawValue === 'string') {
            const parsed = parseInt(rawValue.split(':')[0], 10);
            if (isNaN(parsed)) {
                throw new Error(`Invalid hour format: ${rawValue}`);
            }
            return parsed;
        }
        return Number(rawValue);
    }
    // For days, rawValue should be numeric or numeric string
    const parsed = Number(rawValue);
    if (isNaN(parsed)) {
        throw new Error(`Invalid day format: ${rawValue}`);
    }
    return parsed;
}

/**
 * Retrieves the time configuration for a given action.
 *
 * @param actionType - One of the action types (e.g. 'assign-staff').
 * @param configuration - The configuration DTO with values loaded from API.
 * @returns Object containing:
 *   - value: numeric time to apply,
 *   - unit: 'hour' or 'day',
 *   - requiresImportRequest: flag for actions requiring import request context.
 *
 * @throws When the configuration key is missing or invalid.
 *
 * @example
 * const cfg = { timeToAllowAssign: '02:00', ... };
 * getTimeConfig('assign-staff', cfg);
 * // returns { value: 2, unit: 'hour', requiresImportRequest: false }
 */
function getTimeConfig(
    actionType: ActionType,
    configuration: ConfigurationDto
): { value: number; unit: 'hour' | 'day'; requiresImportRequest: boolean } {
    const config = ACTION_CONFIG_MAP[actionType];
    const rawValue = configuration[config.configKey] as string | number;
    if (rawValue === null || rawValue === undefined) {
        throw new Error(`Missing configuration for action '${actionType}' (key: ${config.configKey})`);
    }
    const value = parseTimeValue(rawValue, config.unit);
    return {
        value,
        unit: config.unit,
        requiresImportRequest: !!config.requiresImportRequest
    };
}

/**
 * Calculates the minimum allowed datetime for an action.
 *
 * @param actionType - The action type (e.g. 'import-order-create').
 * @param configuration - The configuration DTO.
 * @param base - The starting Dayjs reference (default is now).
 * @param importRequest - Optional import request data with startDate.
 * @returns A Dayjs object representing the earliest allowable date/time.
 *
 * @example
 * getMinDateTime('assign-staff', config, dayjs('2025-05-26T08:00'));
 * // returns dayjs('2025-05-26T10:00') if config.timeToAllowAssign = '02:00'
 */
export function getMinDateTime(
    actionType: ActionType,
    configuration: ConfigurationDto,
    base: Dayjs = dayjs(),
    importRequest?: ImportRequestResponse
): Dayjs {
    const { value, unit, requiresImportRequest } = getTimeConfig(actionType, configuration);
    let minDateTime = base.add(value, unit);

    if (requiresImportRequest && actionType === 'import-order-create' && importRequest?.startDate) {
        const startDay = dayjs(importRequest.startDate).startOf('day');
        minDateTime = minDateTime.isAfter(startDay) ? minDateTime : startDay;
    }
    return minDateTime;
}

/**
 * Calculates the maximum allowed datetime for an action, if applicable.
 *
 * @param actionType - The action type (e.g. 'import-request-create').
 * @param configuration - The configuration DTO.
 * @param base - The starting Dayjs reference (default is now).
 * @param hasStartDate - Indicates if an explicit startDate was provided.
 * @param importRequest - Optional import request data with endDate.
 * @returns A Dayjs object for the latest allowable date/time, or null if unbounded.
 *
 * @example
 * getMaxDateTime('import-request-create', config, dayjs('2025-05-26'), true);
 * // returns dayjs('2025-05-29T23:59:59') if config.maxAllowedDaysForImportRequestProcess = 3
 */
function getMaxDateTime(
    actionType: ActionType,
    configuration: ConfigurationDto,
    base: Dayjs = dayjs(),
    hasStartDate: boolean = false,
    importRequest?: ImportRequestResponse
): Dayjs | null {
    if (actionType === 'import-request-create' && hasStartDate) {
        const { value } = getTimeConfig(actionType, configuration);
        return base.add(value, 'day').endOf('day');
    }
    if (actionType === 'import-order-create' && importRequest?.endDate) {
        return dayjs(importRequest.endDate).endOf('day');
    }
    return null;
}

/**
 * Validates if a selected date/time falls within allowed range for an action.
 *
 * @param date - Selected date string ('YYYY-MM-DD').
 * @param time - Selected time string ('HH:mm').
 * @param actionType - The action type.
 * @param configuration - The configuration DTO.
 * @param startDate - Optional base date string.
 * @param importRequest - Optional import request data.
 * @returns True if the selected date/time is within allowed bounds.
 *
 * @example
 * validateDateTime('2025-05-26', '10:30', 'assign-staff', config);
 * // returns true if between min and max allowed times
 */
export function validateDateTime(
    date: string,
    time: string,
    actionType: ActionType,
    configuration: ConfigurationDto | null,
    startDate?: string,
    importRequest?: ImportRequestResponse
): boolean {
    if (!configuration) {
        return false;
    }
    const selected = dayjs(`${date} ${time}`);
    const base = startDate ? dayjs(startDate) : dayjs();
    const min = getMinDateTime(actionType, configuration, base, importRequest);
    const max = getMaxDateTime(actionType, configuration, base, !!startDate, importRequest);
    return selected.isAfter(min) && (max ? selected.isBefore(max) : true);
}

/**
 * Provides a default date and time for UI based on action configuration.
 *
 * @param actionType - The action type.
 * @param configuration - The configuration DTO.
 * @param startDate - Optional base date string.
 * @param importRequest - Optional import request data with startDate.
 * @returns An object with formatted date and time strings.
 *
 * @example
 * getDefaultAssignedDateTimeForAction('import-order-create', config, '2025-05-26', importReq);
 * // returns { date: '2025-05-27', time: '09:30' }
 */
export function getDefaultAssignedDateTimeForAction(
    actionType: ActionType,
    configuration: ConfigurationDto,
    startDate?: string,
    importRequest?: ImportRequestResponse
): { date: string; time: string } {
    const base = startDate ? dayjs(startDate) : dayjs();
    const { value, unit, requiresImportRequest } = getTimeConfig(actionType, configuration);

    let defaultDateTime = unit === 'hour'
        ? base.add(value, 'hour').add(30, 'minute')
        : base.add(value, 'day');

    if (requiresImportRequest && actionType === 'import-order-create' && importRequest?.startDate) {
        const startDay = dayjs(importRequest.startDate).startOf('day').hour(9).minute(0);
        if (defaultDateTime.isBefore(startDay)) {
            defaultDateTime = startDay;
        }
    }

    return {
        date: defaultDateTime.format('YYYY-MM-DD'),
        time: defaultDateTime.format('HH:mm')
    };
}

/**
 * Determines if a specific day should be disabled in a date picker.
 *
 * @param day - The current Dayjs object to evaluate.
 * @param actionType - The action type.
 * @param configuration - The configuration DTO.
 * @param startDate - Optional base date string.
 * @param importRequest - Optional import request data.
 * @returns True if the date is before minimum or after maximum allowed days.
 *
 * @example
 * isDateDisabledForAction(dayjs('2025-05-25'), 'assign-staff', config);
 * // returns true if that date is before the min allowed date
 */
export function isDateDisabledForAction(
    current: Dayjs,
    actionType: ActionType,
    configuration: ConfigurationDto | null,
    startDate?: string,
    importRequest?: ImportRequestResponse
): boolean {
    if (!configuration) {
        return true;
    }
    const base = startDate ? dayjs(startDate) : dayjs();
    const minDay = getMinDateTime(actionType, configuration, base, importRequest).startOf('day');
    const maxDay = getMaxDateTime(actionType, configuration, base, !!startDate, importRequest)?.startOf('day');
    return current.isBefore(minDay) || (maxDay ? current.isAfter(maxDay) : false);
}

/**
 * Provides time picker disabling functions for boundary dates.
 *
 * @param selectedDate - The selected date string ('YYYY-MM-DD').
 * @param actionType - The action type.
 * @param configuration - The configuration DTO.
 * @param startDate - Optional base date string.
 * @param importRequest - Optional import request data.
 * @returns An object with optional disabledHours and disabledMinutes methods.
 *
 * @example
 * getDisabledTimeConfigForAction('2025-05-26', 'assign-staff', config);
 * // returns { disabledHours: ..., disabledMinutes: ... }
 */
export function getDisabledTimeConfigForAction(
    selectedDate: string,
    actionType: ActionType,
    configuration: ConfigurationDto | null,
    startDate?: string,
    importRequest?: ImportRequestResponse
): {
    disabledHours?: () => number[];
    disabledMinutes?: (hour: number) => number[];
} {
    if (!configuration) {
        return {};
    }
    const selDate = dayjs(selectedDate);
    const base = startDate ? dayjs(startDate) : dayjs();
    const minDateTime = getMinDateTime(actionType, configuration, base, importRequest);
    const maxDateTime = getMaxDateTime(actionType, configuration, base, !!startDate, importRequest);
    const { unit } = getTimeConfig(actionType, configuration);

    // Only hour-based actions need time disabling logic
    if (unit !== 'hour') {
        return {};
    }

    // Disable before minDateTime hour
    if (selDate.isSame(minDateTime, 'day')) {
        return {
            disabledHours: () => Array.from({ length: minDateTime.hour() }, (_, i) => i),
            disabledMinutes: (hour) =>
                hour === minDateTime.hour() ? Array.from({ length: minDateTime.minute() }, (_, i) => i) : []
        };
    }
    // Disable after maxDateTime hour
    if (actionType === 'import-order-create' && maxDateTime && selDate.isSame(maxDateTime, 'day')) {
        return {
            disabledHours: () =>
                Array.from({ length: 24 - (maxDateTime.hour() + 1) }, (_, idx) => maxDateTime.hour() + 1 + idx),
            disabledMinutes: (hour) =>
                hour === maxDateTime.hour()
                    ? Array.from({ length: 60 - (maxDateTime.minute() + 1) }, (_, idx) => maxDateTime.minute() + 1 + idx)
                    : []
        };
    }
    return {};
}


/**
 * Maps user roles to Pusher channels.
 *
 * @param userRole - The user's role.
 * @returns The corresponding Pusher channel name or null if no mapping exists.
 *
 * @example
 * getChannelForRole(AccountRole.WAREHOUSE_MANAGER);
 * // returns PRIVATE_WAREHOUSE_MANAGER_CHANNEL
 */
export function getChannelForRole(userRole: AccountRole): string | null {
    switch (userRole) {
        case AccountRole.WAREHOUSE_MANAGER:
            return PRIVATE_WAREHOUSE_MANAGER_CHANNEL;
        case AccountRole.DEPARTMENT:
            return PRIVATE_DEPARTMENT_CHANNEL;
        case AccountRole.STAFF:
            return PRIVATE_STAFF_CHANNEL;
        case AccountRole.ACCOUNTING:
            return PRIVATE_ACCOUNTING_CHANNEL;
        case AccountRole.ADMIN:
            return PRIVATE_ADMIN_CHANNEL;
        default:
            console.warn(`No channel defined for role: ${userRole}`);
            return null;
    }
}