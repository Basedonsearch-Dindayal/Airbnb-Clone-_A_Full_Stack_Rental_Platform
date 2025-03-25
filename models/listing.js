const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const DEFAULT_IMAGE_URL = "https://t4.ftcdn.net/jpg/02/51/95/53/360_F_251955356_FAQH0U1y1TZw3ZcdPGybwUkH90a3VAhb.jpg";

const listingSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  image: {
    url: { type: String, trim: true },
    filename: { type: String, default: "default-image", trim: true }
  },
  price: { type: Number, required: true, min: 0 },
  location: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  reviews: [
    {
    type: Schema.Types.ObjectId,
    ref: "Review",
  }
],
owner:{
  type: Schema.Types.ObjectId,
  ref: "User",
},
});

// Middleware to set default image if none is provided
listingSchema.pre("save", function (next) {
  if (!this.image || !this.image.url) {
    this.image = { url: DEFAULT_IMAGE_URL, filename: "default-image" };
  }
  next();
});

// Middleware to delete associated reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async function (listing) {
  if (listing && listing.reviews.length) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
