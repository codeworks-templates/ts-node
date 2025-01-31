import { isAuthorized } from '../middleware/IsAuthorized.ts';
import { requestLogger } from '../middleware/RequestLogger.ts';
import { ApiController, Created, Forbidden, NotFound, Ok } from '../utils/ApiController.ts';
import type { ActionResult, FromBody, FromClient } from '../utils/ApiController.ts';

const values = [
  { id: 1, },
  { id: 2, },
  { id: 3, },
  { id: 4, },
  { id: 5, }
];

export default class ValuesController extends ApiController {
  constructor() {
    super('/api/values', [requestLogger]);
    this
      .get('', this.getValues)
      .get('/:id', this.getValue)
      .post('', this.createValue, [isAuthorized])
      .delete('/:id', this.deleteValue, [isAuthorized]);

  }

  async getValues() {
    return Ok(values);
  }

  async getValue({ params }: FromClient<any, { id: number }>): Promise<ActionResult<any>> {
    const id = params.id;
    const value = values.find(value => value.id == Number(id));
    if (!value) {
      return NotFound(`Value with id ${id} not found`);
    }
    return Ok(value);
  }

  async createValue({ body }: FromBody<any>) {
    const newValue = body;
    newValue.id = values.length + 1;
    values.push(newValue);
    return Created(newValue);
  }

  deleteValue({ params }: FromClient<any, { id: number }>): ActionResult<any> {
    const id = params.id;
    const index = values.findIndex(value => value.id == Number(id));
    if (index === -1) {
      return NotFound(`Value with id ${id} not found`);
    }
    values.splice(index, 1);
    return Ok({ message: 'Value deleted successfully' });
  }

}