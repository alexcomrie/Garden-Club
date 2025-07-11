import { z } from "zod";

// Business Schema - matching the Dart Business model exactly
export const BusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerName: z.string(),
  address: z.string(),
  phoneNumber: z.string(),
  whatsAppNumber: z.string(),
  emailAddress: z.string(),
  hasDelivery: z.boolean(),
  deliveryArea: z.string(),
  operationHours: z.string(),
  specialHours: z.string(),
  profilePictureUrl: z.string(),
  productSheetUrl: z.string(),
  status: z.string(),
  bio: z.string(),
  mapLocation: z.string(),
  deliveryCost: z.number().nullable(),
  islandWideDelivery: z.string(),
  islandWideDeliveryCost: z.number().nullable()
});

// Product Schema - matching the Dart Product model exactly
export const ProductSchema = z.object({
  name: z.string(),
  category: z.string(),
  price: z.number(),
  description: z.string(),
  imageUrl: z.string(),
  inStock: z.boolean()
});

// Cart Item Schema - matching the Dart CartProvider structure
export const CartItemSchema = z.object({
  product: ProductSchema,
  quantity: z.number(),
  business: BusinessSchema
});

// Cart Schema - matching the Dart CartProvider structure
export const CartSchema = z.object({
  orders: z.array(CartItemSchema),
  customerName: z.string(),
  deliveryOption: z.enum(['pickup', 'delivery', 'island_wide']),
  deliveryAddress: z.string(),
  pickupTime: z.string(),
  selectedBusiness: BusinessSchema.nullable()
});

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
});

export const InsertUserSchema = UserSchema.omit({ id: true });

// Restaurant Schema
export const RestaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  phoneNumber: z.string(),
  whatsAppNumber: z.string().optional(),
  openingHours: z.string(),
  hasDelivery: z.boolean(),
  deliveryPrice: z.number(),
  imageUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  description: z.string().optional(),
  mixPrices: z.record(z.string(), z.number()).optional(),
});

// MenuItem Schema
export const MenuItemSchema = z.object({
  name: z.string(),
  section: z.string(),
  category: z.string(),
  prices: z.record(z.string(), z.number()),
  period: z.string(),
  displayDate: z.string().optional(),
  specials: z.array(z.string()),
  specialOption: z.string().optional(),
  specialCap: z.number().optional(),
  description: z.string().optional(),
  sides: z.array(z.string()),
  veg: z.array(z.string()),
  gravey: z.array(z.string()),
});

export type Business = z.infer<typeof BusinessSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type User = z.infer<typeof UserSchema>;
export type InsertUser = z.infer<typeof InsertUserSchema>;
export type Restaurant = z.infer<typeof RestaurantSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;