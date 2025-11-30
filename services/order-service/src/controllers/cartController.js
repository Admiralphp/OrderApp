const { Cart, CartItem } = require('../models/Cart');
const axios = require('axios');
const config = require('../config');
const logger = require('../config/logger');

exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({
      where: { userId },
      include: [{ model: CartItem, as: 'items' }]
    });

    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Fetch product details for each cart item
    const itemsWithDetails = await Promise.all(
      cart.items.map(async (item) => {
        try {
          const response = await axios.get(
            `${config.externalServices.productService}/api/v1/products/${item.productId}`,
            { headers: { Authorization: req.headers.authorization } }
          );
          
          const product = response.data.data.product;
          
          return {
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            product: {
              name: product.name,
              price: product.price,
              image: product.images[0],
              stock: product.stock,
              isAvailable: product.isAvailable
            },
            subtotal: product.price * item.quantity
          };
        } catch (error) {
          logger.warn('Product not found', { productId: item.productId });
          return null;
        }
      })
    );

    const validItems = itemsWithDetails.filter(item => item !== null);
    const total = validItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({
      success: true,
      data: {
        cart: {
          id: cart.id,
          items: validItems,
          total: total.toFixed(2)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    // Verify product exists
    try {
      await axios.get(
        `${config.externalServices.productService}/api/v1/products/${productId}`,
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let cart = await Cart.findOne({ where: { userId } });
    
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Check if item already exists
    const existingItem = await CartItem.findOne({
      where: { cartId: cart.id, productId }
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      await existingItem.save();
    } else {
      await CartItem.create({
        cartId: cart.id,
        productId,
        quantity
      });
    }

    logger.info('Item added to cart', { userId, productId, quantity });

    // Return updated cart
    req.user.id = userId;
    exports.getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const userId = req.user.id;

    const cart = await Cart.findOne({ where: { userId } });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = await CartItem.findOne({
      where: { 
        id: req.params.itemId,
        cartId: cart.id 
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    item.quantity = quantity;
    await item.save();

    exports.getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ where: { userId } });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    await CartItem.destroy({
      where: { 
        id: req.params.itemId,
        cartId: cart.id 
      }
    });

    logger.info('Item removed from cart', { userId, itemId: req.params.itemId });

    exports.getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ where: { userId } });
    
    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id } });
      logger.info('Cart cleared', { userId });
    }

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};
