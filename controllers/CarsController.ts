import { isAuthorized } from '../middleware/IsAuthorized.ts';
import { requestLogger } from '../middleware/RequestLogger.ts';
import { carsService } from '../services/CarsService.ts';
import { ApiController, Created, Forbidden, NotFound, Ok } from '../utils/ApiController.ts';
import type { ActionResult, FromBody, FromClient } from '../utils/ApiController.ts';

interface Car {
  id: number;
  make: string;
  model: string;
}

const cars = [
  { id: 1, make: 'Toyota', model: 'Corolla' },
  { id: 2, make: 'Ford', model: 'F150' },
  { id: 3, make: 'Chevy', model: 'Silverado' },
  { id: 4, make: 'Chevy', model: 'Tahoe' },
  { id: 5, make: 'Ford', model: 'Fusion' }
];

export default class CarController extends ApiController {
  constructor() {
    super('api/cars', [requestLogger]);
    this
      .get('', this.getCars)
      .get('/:id', this.getCar, [], 'Get a car by id')
      .get('/:id/bids', this.getCarBids, [], 'Get a car\'s bids')
      .post('', this.createCar, [isAuthorized], 'Create a car')
      .delete('/:id', this.deleteCar, [isAuthorized], 'Delete a car');
  }

  async getCars() {

    const cars = await carsService.getCars();
    // const make = query.make;
    // console.log('make', query);
    // const filteredCars = make ? cars.filter(car => car.make === make) : cars;

    return Ok(cars);
  }

  async getCar({ params }: FromClient<any, { id: number }>): Promise<ActionResult<Car>> {

    const id = params.id;
    const car = cars.find(car => car.id == id);
    if (!car) {
      return NotFound(`Car with id ${id} not found`);
    }
    return Ok(car);
  }
  getCarBids() {

    return Ok([{ id: 1, amount: 1000 }, { id: 2, amount: 2000 }]);

  }

  async createCar({ body }: FromBody<Car>) {
    const newCar = body;
    newCar.id = cars.length + 1;
    cars.push(newCar);
    return Created(newCar);
  }

  deleteCar(ctx: FromClient): ActionResult<Car> {
    throw Forbidden('You are not authorized to delete a car');
  }

}