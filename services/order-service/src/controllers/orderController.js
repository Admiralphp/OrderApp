const { Order, OrderItem } = require('../models/Order');
const logger = require('../config/logger');
const axios = require('axios');
const config = require('../config');

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

exports.createOrder = async (req, res, next) => {
  const t = await Order.sequelize.transaction();
  
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate products and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      try {
        const productResponse = await axios.get(
          `${config.externalServices.productService}/api/v1/products/${item.productId}`,
          { headers: { Authorization: req.headers.authorization } }
        );

        const product = productResponse.data.data.product;
        
        if (!product.isAvailable) {
          throw new Error(`Product ${product.name} is not available`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: item.quantity,
          price: product.price,
          subtotal
        });
      } catch (error) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

    // Create order
    const order = await Order.create({
      userId,
      orderNumber: generateOrderNumber(),
      totalAmount,
      shippingAddress,
      paymentMethod
    }, { transaction: t });

    // Create order items
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      orderId: order.id
    }));
    
    await OrderItem.bulkCreate(itemsWithOrderId, { transaction: t });

    await t.commit();

    // Fetch complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }]
    });

    logger.info('Order created', { orderId: order.id, userId });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order: completeOrder }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const userId = req.user.id;
    
    const query = { userId };
    if (status) query.status = status;

    const orders = await Order.findAndCountAll({
      where: query,
      include: [{ model: OrderItem, as: 'items' }],
      limit: limit * 1,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        totalPages: Math.ceil(orders.count / limit),
        currentPage: page,
        totalOrders: orders.count
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update timestamps based on status
    if (status === 'shipped' && !order.shippedAt) {
      order.shippedAt = new Date();
    }
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    order.status = status;
    await order.save();

    logger.info('Order status updated', { orderId: order.id, status });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel delivered orders'
      });
    }

    order.status = 'cancelled';
    await order.save();

    logger.info('Order cancelled', { orderId: order.id });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};
