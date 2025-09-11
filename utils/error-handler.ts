export const ErrorTypes = {
    BAD_USER_INPUT: {
        errorCode: "BAD_USER_INPUT",
        errorStatus: 400,
    },
    BAD_REQUEST: {
        errorCode: "BAD_REQUEST",
        errorStatus: 400,
    },
    NOT_FOUND: {
        errorCode: 'NOT_FOUND',
        errorStatus: 404,
    },
    UNAUTHENTICATED: {
        errorCode: 'UNAUTHENTICATED',
        errorStatus: 401,
    },
    ALREADY_EXISTS: {
        errorCode: 'ALREADY_EXISTS',
        errorStatus: 400,
    },
    INTERNAL_SERVER_ERROR: {
        errorCode: "INTERNAL_SERVER_ERROR",
        errorStatus: 500,
    },
};

// ...existing code...