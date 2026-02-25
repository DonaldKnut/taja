/**
 * Centralized error handling for Database/Mongoose errors
 * Translates low-level technical errors into human-readable messages
 */

export interface HumanizedError {
    success: false;
    message: string;
    status: number;
    field?: string;
}

/**
 * Parses MongoDB/Mongoose errors and returns a sanitized user-friendly message
 */
export function handleDbError(error: any): HumanizedError {
    // Console log for debugging (will show in server logs)
    console.error('Core Database Error:', error);

    // 1. Handle MongoDB Duplicate Key Error (Code 11000)
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        const value = error.keyValue ? error.keyValue[field] : '';

        if (field === 'phone') {
            return {
                success: false,
                message: `The phone number "${value}" is already linked to another account. Please use a different number.`,
                status: 400,
                field: 'phone'
            };
        }

        if (field === 'email') {
            return {
                success: false,
                message: 'This email address is already registered. Try signing in instead.',
                status: 400,
                field: 'email'
            };
        }

        if (field === 'username') {
            return {
                success: false,
                message: 'This username is already taken. Please choose another one.',
                status: 400,
                field: 'username'
            };
        }

        return {
            success: false,
            message: 'This information is already in use by another account.',
            status: 400,
            field
        };
    }

    // 2. Handle Mongoose Validation Errors
    if (error.name === 'ValidationError') {
        const firstError = Object.values(error.errors)[0] as any;
        return {
            success: false,
            message: firstError?.message || 'Invalid data provided.',
            status: 400
        };
    }

    // 3. Handle Cast Errors (e.g., invalid ObjectId)
    if (error.name === 'CastError') {
        return {
            success: false,
            message: 'The requested resource could not be found or the ID is invalid.',
            status: 404
        };
    }

    // 4. Fallback for generic errors
    return {
        success: false,
        message: error.message || 'Something went wrong while processing your request.',
        status: error.status || 500
    };
}
