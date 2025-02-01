import { dbContext } from "../db/dbContext.ts"

class CarsService {
  async getCarById(carId) {
    // NOTE populate is a method that will run our virtual method
    const car = await dbContext.Cars.findById(carId).populate('creator')

    if (car == null) {
      throw new Error(`Invalid car id: ${carId}`)
    }

    return car
  }

  async get() {
    const cars = await dbContext.Cars.find()
    return cars
  }

  async getCars(carQuery = { page: '1', sortBy: 'createdAt' }) {
    // NOTE which "page" of cars the client is trying to access. Defaults to 1 if parseInt returns something falsy
    const pageNumber = parseInt(carQuery.page) || 1
    // how many cars to send back at a time
    const carLimit = 10
    // how many car documents to skip over in our database. if pageNumber is 1, we skip 0. if pageNumber is 2, we skip 10, etc...
    const skipAmount = (pageNumber - 1) * carLimit
    // removes key:value pair from object. This needs to be done so find does not look for cars with a page of 3
    delete carQuery.page

    const sortBy = carQuery.sortBy
    delete carQuery.sortBy

    const cars = await dbContext.Cars
      .find(carQuery)
      .sort(sortBy)
      .skip(skipAmount)
      .limit(carLimit)
    // .populate('creator') // NOTE populate is called on each document returned from find

    // NOTE counts how many total car documents in the database. Can also take in a filter object
    const carCount = await dbContext.Cars.countDocuments(carQuery)

    // NOTE we can format response however we wish. We can send back an object with all sorts of information
    const carResponse = {
      count: carCount,
      page: pageNumber,
      totalPages: Math.ceil(carCount / carLimit), // 5.5 rounds up to 6
      results: cars,
    }

    return carResponse
  }
}

export const carsService = new CarsService()