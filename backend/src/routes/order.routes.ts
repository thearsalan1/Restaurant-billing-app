import { Router } from "express";
import * as c from "../controllers/order.controller";
import { validate } from "../middlewares/validate";
import { idParamSchema } from "../validators/common";
import {
  createOrderSchema,
  addItemSchema,
  updateItemSchema,
  orderItemParamsSchema,
  billSchema,
  paySchema,
} from "../validators/order.validator";

const router = Router();

router.get("/", c.list);
router.post("/", validate({ body: createOrderSchema }), c.create);
router.get("/:id", validate({ params: idParamSchema }), c.getOne);

router.post(
  "/:id/items",
  validate({ params: idParamSchema, body: addItemSchema }),
  c.addItem,
);
router.patch(
  "/:id/items/:itemId",
  validate({ params: orderItemParamsSchema, body: updateItemSchema }),
  c.updateItem,
);
router.delete(
  "/:id/items/:itemId",
  validate({ params: orderItemParamsSchema }),
  c.removeItem,
);

router.post("/:id/cancel", validate({ params: idParamSchema }), c.cancel);

router.post(
  "/:id/bill/preview",
  validate({ params: idParamSchema, body: billSchema }),
  c.previewBill,
);
router.post(
  "/:id/bill",
  validate({ params: idParamSchema, body: billSchema }),
  c.generateBill,
);
router.post(
  "/:id/pay",
  validate({ params: idParamSchema, body: paySchema }),
  c.pay,
);

export default router;
