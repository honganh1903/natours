// review/ rating/ createdAt/ ref to tour/ref to user
const mongoose = require('mongoose');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const reviewController = require('../controllers/reviewController');

const ReviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user!']
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ReviewSchema.index({tour:1, user:1}, {unique:true})

ReviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

ReviewSchema.statics.calcAverageRating = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  if(stats.length >0){
  Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating
  })
}else{
  Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: 0,
    ratingsAverage: 4.5
})
}}

ReviewSchema.post('save', function(next) {
  // this point to current review
  this.constructor.calcAverageRating(this.tour);
});

ReviewSchema.pre('/^findOneAnd', async function(next) {
  this.r = await this.findOne();
  next();
});

ReviewSchema.post('/^findOneAnd', async function(next) {
  this.r.constructor.calcAverageRating(this.r.tour) = await this.findOne();
  next();
});


const Review = mongoose.model('Review', ReviewSchema)

module.exports = Review
