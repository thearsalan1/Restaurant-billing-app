import mongoose from "mongoose";
import { connectDB } from "./config/db";
import { Category, MenuItem, Table, Order, Counter } from "./models";

const rupees = (n: number) => n * 100;

async function seed() {
  await connectDB();

  await Promise.all([
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Table.deleteMany({}),
    Order.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  await Promise.all([
    Category.syncIndexes(),
    MenuItem.syncIndexes(),
    Table.syncIndexes(),
    Order.syncIndexes(),
  ]);

  const [starters, mains, breads, rice, drinks, desserts] =
    await Category.insertMany([
      { name: "Starters" },
      { name: "Main Course" },
      { name: "Breads" },
      { name: "Rice & Biryani" },
      { name: "Beverages" },
      { name: "Desserts" },
    ]);

  await MenuItem.insertMany([
    {
      name: "Paneer Tikka",
      category: starters._id,
      price: rupees(240),
      isVeg: true,
    },
    {
      name: "Chicken 65",
      category: starters._id,
      price: rupees(260),
      isVeg: false,
    },
    {
      name: "Veg Manchurian",
      category: starters._id,
      price: rupees(180),
      isVeg: true,
    },

    {
      name: "Paneer Butter Masala",
      category: mains._id,
      price: rupees(280),
      isVeg: true,
    },
    {
      name: "Dal Makhani",
      category: mains._id,
      price: rupees(220),
      isVeg: true,
    },
    {
      name: "Butter Chicken",
      category: mains._id,
      price: rupees(340),
      isVeg: false,
    },
    {
      name: "Mutton Rogan Josh",
      category: mains._id,
      price: rupees(420),
      isVeg: false,
    },

    {
      name: "Butter Naan",
      category: breads._id,
      price: rupees(50),
      isVeg: true,
    },
    {
      name: "Tandoori Roti",
      category: breads._id,
      price: rupees(25),
      isVeg: true,
    },
    {
      name: "Garlic Naan",
      category: breads._id,
      price: rupees(60),
      isVeg: true,
    },

    {
      name: "Veg Biryani",
      category: rice._id,
      price: rupees(220),
      isVeg: true,
    },
    {
      name: "Chicken Biryani",
      category: rice._id,
      price: rupees(300),
      isVeg: false,
    },
    { name: "Jeera Rice", category: rice._id, price: rupees(120), isVeg: true },

    {
      name: "Masala Chai",
      category: drinks._id,
      price: rupees(30),
      isVeg: true,
    },
    {
      name: "Sweet Lassi",
      category: drinks._id,
      price: rupees(70),
      isVeg: true,
    },
    {
      name: "Cold Drink",
      category: drinks._id,
      price: rupees(40),
      isVeg: true,
    },

    {
      name: "Gulab Jamun (2 pc)",
      category: desserts._id,
      price: rupees(80),
      isVeg: true,
    },
    {
      name: "Ice Cream",
      category: desserts._id,
      price: rupees(90),
      isVeg: true,
      isAvailable: false,
    },
  ]);

  await Table.insertMany(
    Array.from({ length: 8 }, (_, i) => ({
      number: i + 1,
      capacity: i < 4 ? 2 : 4,
    })),
  );

  console.log("🌱 Seed complete: 6 categories, 18 items, 8 tables");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
