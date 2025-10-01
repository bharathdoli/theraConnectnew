"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schemas) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = {};
        if (schemas.body)
            validatedData.body = yield schemas.body.parseAsync(req.body);
        if (schemas.query) {
            // Debug log for query validation
            // eslint-disable-next-line no-console
            console.log('[validate] incoming query=', req.query);
            try {
                validatedData.query = yield schemas.query.parseAsync(req.query);
            }
            catch (e) {
                console.error('[validate.query][ERROR]', e.issues || e);
                throw e;
            }
            // eslint-disable-next-line no-console
            console.log('[validate] validated query=', validatedData.query);
        }
        if (schemas.params)
            validatedData.params = yield schemas.params.parseAsync(req.params);
        // Apply only body (safe to overwrite). For query/params, avoid assignment
        // because in Express 5 these are readonly accessors and reassigning throws.
        if (validatedData.body)
            req.body = validatedData.body;
        // Make validated values available without mutating Express objects
        // Access via res.locals.validated in controllers if needed.
        res.locals.validated = validatedData;
        return next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const formattedErrors = error.issues.map((err) => ({
                field: err.path.join('.') || 'body',
                message: err.message,
            }));
            return res.status(400).json({
                status: 'error',
                message: 'Invalid request data. Please check the following fields.',
                errors: formattedErrors,
            });
        }
        // eslint-disable-next-line no-console
        console.error('[validate][ERROR]', error);
        return res.status(500).json({ status: 'error', message: (error === null || error === void 0 ? void 0 : error.message) || 'Internal server error' });
    }
});
exports.validate = validate;
