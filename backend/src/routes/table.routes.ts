import { Router } from 'express';
import * as c from '../controllers/table.controller';
import { validate } from '../middlewares/validate';
import { idParamSchema } from '../validators/common';
import { createTableSchema, updateTableSchema } from '../validators/table.validator';

const router = Router();

router.get('/', c.list);
router.post('/', validate({ body: createTableSchema }), c.create);
router.patch('/:id', validate({ params: idParamSchema, body: updateTableSchema }), c.update);
router.delete('/:id', validate({ params: idParamSchema }), c.remove);

export default router;