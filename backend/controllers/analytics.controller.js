import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import { DataTypes } from "sequelize";

const AllgetAnalyticsData = async () => {
  const totalUsers = await User.countDocuments();
  console.log("totaluser ...", totalUsers);

  const totalProducts = await Product.countDocuments();
  console.log("totalProducts...", totalProducts);

  const salesData = await Order.aggregate([
    // it takes array

    {
      $group: {
        _id: null, // it groups all documents together so under the same group
        // totalsale means counts of the orders number
        totalSales: { $sum: 1 }, // sum of the entire document and one stands for true
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);
  // salesdata return an arrauy if data is empty then show 0-0 value in both of them
  const { totalSales, totalRevenue } = salesData[0] || {
    totalSales: 0,
    totalRevenue: 0,
  };

  return {
    users: totalUsers,
    products: totalProducts,
    sales: totalSales,
    revenue: totalRevenue,
  };
};

const getDailySalesData = async (startDate, endDate) => {

  const dailySalesData = await Order.aggregate([

    {
      $match: {
        createdAt: {
          // show last week orders
          $gte: startDate, // greater than
          $lte: endDate, // less than
        },
      },
    },

    {
      $group: {
        _id: { $dateToString: { format: "%y-%m-%d", date: "$createdAt" } },
        sales: { $sum: 1 }, // sum of the entire/all orders for each day { $sum: 1 } is used for counting the number of documents in each group.

        revenue: { $sum: "$totalAmount" },
      },
    },

    {
      $sort: { _id: 1 },
    },
    
  ]);
  // example of daily sales data
  // [
  //     {
  //         _id:"2023-06-01",
  //         sales:10,
  //         revenue:100
  //     },
  //     {
  //         _id:"2024-09-12",
  //         sales:11,
  //         revenue:110
  //     },
  //     {
  //         _id:"2024-10-13",
  //         sales:11,
  //         revenue:120
  //     },
  //     {
  //         _id:"2024-11-15",
  //         sales:12,
  //         revenue:130
  //     },
  //     {
  //         _id:"2024-12-12",
  //         sales:12,
  //         revenue:140
  //     },
  //     {
  //         _id:"2025-01-01",
  //         sales:13,
  //         revenue:150
  //     },
  //     {
  //         _id:"2025-02-02",
  //         sales:14,
  //         revenue:160
  //     },
  // ]
  // we have just created the sales data and need to get date as well
  // create a function for the date
  
  const dateArray = getDatesInRange(startDate, endDate);
  console.log("dateArray...", dateArray);

  return dateArray.map((date) => {
    const salesData = dailySalesData.find((data) => data._id === date);
    return {
      date,
      sales: salesData?.sales || 0,
      revenue: salesData?.revenue || 0,
    };
  });
};
const getDatesInRange = async (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

  /**
   * Gets analytics data for the past 7 days.
   * @param {Object} req - The Express request object.
   * @param {Object} res - The Express response object.
   * @returns {Object} - JSON response with analytics data and daily sales data for the past 7 days.
   * @throws {Error} - Returns a 500 error if there is a server error during the operation.
   */
export const getAnalyticsData = async (req, res) => {
  try {
    const analyticsData = await AllgetAnalyticsData();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7days back date

    const dailySalesData = await getDailySalesData(startDate, endDate);

    res.json({
      analyticsData,
      dailySalesData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "server error ", error: error.message });
  }
};


