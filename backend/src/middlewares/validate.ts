import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

interface Schemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate =
  (schemas: Schemas) => (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.params) schemas.params.parse(req.params);
    if (schemas.body) req.body= schemas.body.parse(req.body);
    next();
  };
