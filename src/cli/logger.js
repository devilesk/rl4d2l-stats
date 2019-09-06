const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { format } = require('logform');

const enumerateErrorFormat = format((info) => {
    if (info.message instanceof Error) {
        // eslint-disable-next-line no-param-reassign
        info.message = Object.assign({
            message: info.message.message,
            stack: info.message.stack,
        }, info.message);
    }

    if (info instanceof Error) {
        return Object.assign({
            message: info.message,
            stack: info.stack,
        }, info);
    }

    return info;
});

const alignedWithColorsAndTime = format.combine(
    format.colorize(),
    format.timestamp(),
    format.align(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
);

const rotateOpts = {
    format: format.combine(
        format.timestamp(),
        enumerateErrorFormat(),
        format.json(),
    ),
    dirname: 'logs',
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
};

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    exitOnError: false,
    transports: [
        new winston.transports.Console({
            format: alignedWithColorsAndTime,
            handleExceptions: true,
        }),
        new DailyRotateFile(rotateOpts),
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'exceptions.log' }),
    ],
});

logger.transports.forEach((t) => {
    // eslint-disable-next-line no-param-reassign
    t.silent = (process.env.LOG_SILENT === 'true');
});

logger.error = (item) => {
    const message = item instanceof Error
        ? item.stack.replace('\n', '').replace('    ', ' - trace: ')
        : item;
    logger.log({ level: 'error', message });
};

process.on('unhandledRejection', (err) => {
    logger.error(err);
    process.exit(1);
});

module.exports = logger;
