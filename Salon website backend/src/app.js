import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import bookingRoutes from "./routes/bookings.routes.js";
import businessInfoRoutes from "./routes/businessInfo.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import dayOffRoutes from "./routes/dayoff.routes.js";
import giftCardRoutes from "./routes/giftCards.routes.js";
import productVariantRoutes from "./routes/productVariants.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import heroSlideRoutes from "./routes/heroSlides.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import paymentRoutes from "./routes/payments.routes.js";
import productRoutes from "./routes/products.routes.js";
import reviewRoutes from "./routes/reviews.routes.js";
import serviceLengthOptionRoutes from "./routes/serviceLengthOptions.routes.js";
import serviceRoutes from "./routes/services.routes.js";
import shopCategoryTileRoutes from "./routes/shopCategoryTiles.routes.js";
import systemRoutes from "./routes/system.routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(morgan("dev"));

app.use("/health", systemRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/business-info", businessInfoRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/gift-cards", giftCardRoutes);
app.use("/api/product-variants", productVariantRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/service-length-options", serviceLengthOptionRoutes);
app.use("/api/hero-slides", heroSlideRoutes);
app.use("/api/shop-category-tiles", shopCategoryTileRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/days-off", dayOffRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);