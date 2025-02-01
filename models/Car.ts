import { Schema } from "mongoose";

export const CarSchema = new Schema(
  {
    make: { type: String, minLength: 3, maxLength: 50, required: true },
    model: { type: String, minLength: 1, maxLength: 100, required: true },
    year: { type: Number, min: 1886, max: 2025, required: true },
    price: { type: Number, min: 0, max: 1000000, required: true },
    imgUrl: { type: String, maxLength: 500, required: true },
    description: { type: String, maxLength: 500 },
    // ENUM denotes that the engineType must be one of the strings in the enum array
    engineType: { type: String, enum: ['V6', 'V8', 'V10', '4-Cylinder', 'unknown'], required: true },
    color: { type: String, maxLength: 50, required: true },
    // tags is an array of strings ['convertible', 'rear wheel drive', 'manual transmission]
    tags: { type: [String], required: true },
    mileage: { type: Number, min: 0, max: 1000000, required: true, default: 0 },
    hasCleanTitle: { type: Boolean, required: true, default: true },
    // object id must look something like 6615af31b500d41de2bfbe28
    creatorId: { type: Schema.ObjectId, required: true, ref: 'Account' }
  },
  {
    // adds createdAt and updatedAt to our data
    timestamps: true,
    // allows virtual properties on our schemas
    toJSON: { virtuals: true }
  }
)
// // NOTE virtuals
// // adds a virtual property to our schema (a computed property that does not exist in the database)
// // first argument is the name of the virtual. This is what the property will be called on our objects, and also how we indicate which virtual to run when we call populate
// // this virtual attaches an account object to our car schema (account who posted the car)
// CarSchema.virtual('creator', {
//   localField: 'creatorId', // take this value from my schema
//   ref: 'Account', // look through this collection
//   foreignField: '_id', // match my localField to this value from the referenced collection
//   justOne: true // return a single object
// })