const { Schema } = require('mongoose');

// GeoJSON point: coordinates are [longitude, latitude].
module.exports = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number],
      validate: { validator: (v) => !v || v.length === 2, message: 'coordinates must be [lng, lat]' },
    },
    address: String,
    suburb: String,
    city: String,
    province: String,
  },
  { _id: false }
);
