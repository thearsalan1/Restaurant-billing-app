import { Router } from 'express';
import * as c from '../controllers/category.controller';
import { validate } from '../middlewares/validate';
import { idParamSchema } from '../validators/common';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

const router = Router();

router.get('/', c.list);
router.post('/', validate({ body: createCategorySchema }), c.create);
router.patch('/:id', validate({ params: idParamSchema, body: updateCategorySchema }), c.update);
router.delete('/:id', validate({ params: idParamSchema }), c.remove);

export default router;