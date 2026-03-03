const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  products: [
    {
      product: { type: Object, required: true },//{ type: Object }: Kitabın o anki tüm bilgilerini (adı, fiyatı, kapak resmi vb.)
      quantity: { type: Number, required: true }
    }
  ],
  user: {
    name: { type: String, required: true },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  }
  , userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
});

module.exports = mongoose.model('Order', orderSchema);