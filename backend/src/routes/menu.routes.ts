import { Router } from "express";
import * as c from "../controllers/menu.controller";
import { validate } from "../middlewares/validate";
import { idParamSchema } from "../validators/common";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  availabilitySchema,
} from "../validators/menu.validator";

const router = Router();

router.get("/", c.list);
router.post("/", validate({ body: createMenuItemSchema }), c.create);
router.patch(
  "/:id",
  validate({ params: idParamSchema, body: updateMenuItemSchema }),
  c.update,
);
router.patch(
  "/:id/availability",
  validate({ params: idParamSchema, body: availabilitySchema }),
  c.updateAvailability,
);
router.delete("/:id", validate({ params: idParamSchema }), c.remove);

export default router;
