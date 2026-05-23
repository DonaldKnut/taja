"use client";

import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign,
  ShoppingBag,
  Users,
  Search,
  Bell,
  Menu
} from "lucide-react";

export function DashboardPreview() {
  // Shimmer animation for skeleton elements
  const shimmerVariants = {
    animate: {
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  // Stagger animation for cards
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative mt-16 md:mt-20"
    >
      {/* Dashboard Card Container */}
      <div className="relative max-w-6xl mx-auto">
        {/* Card Shadow/Glow Effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-taja-primary/20 to-emerald-600/20 rounded-3xl blur-2xl opacity-50"></div>
        
        {/* Main Dashboard Card */}
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-sm">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Logo/Title */}
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-7 h-7 rounded-lg bg-gradient-to-br from-taja-primary to-emerald-600 flex items-center justify-center"
                >
                  <ShoppingBag className="h-4 w-4 text-white" />
                </motion.div>
                <div>
                  <motion.div
                    variants={shimmerVariants}
                    animate="animate"
                    className="h-3 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%]"
                  />
                  <motion.div
                    variants={shimmerVariants}
                    animate="animate"
                    className="h-2.5 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] mt-1"
                  />
                </div>
              </div>

              {/* Center: Search Bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="hidden md:flex flex-1 max-w-xs mx-4"
              >
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <motion.div
                    variants={shimmerVariants}
                    animate="animate"
                    className="h-8 w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg bg-[length:200%_100%]"
                  />
                </div>
              </motion.div>

              {/* Right: Icons */}
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <Bell className="h-3.5 w-3.5 text-gray-500" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-taja-primary to-emerald-600 flex items-center justify-center"
                >
                  <Users className="h-3.5 w-3.5 text-white" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-4 md:p-5 bg-gray-50">
            {/* Stats Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"
            >
              {[
                { icon: DollarSign, label: "Revenue", color: "from-emerald-500 to-emerald-600" },
                { icon: Package, label: "Orders", color: "from-emerald-400 to-emerald-500" },
                { icon: TrendingUp, label: "Growth", color: "from-emerald-600 to-emerald-700" },
                { icon: Users, label: "Customers", color: "from-emerald-300 to-emerald-400" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <motion.div
                      variants={shimmerVariants}
                      animate="animate"
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                    >
                      <stat.icon className="h-5 w-5 text-white" />
                    </motion.div>
                    <motion.div
                      variants={shimmerVariants}
                      animate="animate"
                      className="h-3 w-3 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"
                    />
                  </div>
                  <motion.div
                    variants={shimmerVariants}
                    animate="animate"
                    className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] mb-2"
                  />
                  <motion.div
                    variants={shimmerVariants}
                    animate="animate"
                    className="h-6 w-24 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded bg-[length:200%_100%]"
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Chart/Graph Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-taja-primary" />
                  <motion.div
                    variants={shimmerVariants}
                    animate="animate"
                    className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%]"
                  />
                </div>
                <motion.div
                  variants={shimmerVariants}
                  animate="animate"
                  className="h-3 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%]"
                />
              </div>
              {/* Chart Bars */}
              <div className="flex items-end justify-between gap-1.5 h-28">
                {[65, 80, 45, 90, 70, 85, 60, 75, 55, 95].map((height, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + index * 0.05, duration: 0.5, ease: "easeOut" }}
                    className="flex-1 bg-gradient-to-t from-taja-primary via-emerald-500 to-emerald-400 rounded-t-lg"
                  />
                ))}
              </div>
            </motion.div>

            {/* Product Grid Preview - Compact */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <motion.div
                  variants={shimmerVariants}
                  animate="animate"
                  className="h-4 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%]"
                />
                <motion.div
                  variants={shimmerVariants}
                  animate="animate"
                  className="h-3 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%]"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {[1, 2, 3, 4].map((item) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.1 + item * 0.1 }}
                    className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100"
                  >
                    <motion.div
                      variants={shimmerVariants}
                      animate="animate"
                      className="h-20 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"
                    />
                    <div className="p-2">
                      <motion.div
                        variants={shimmerVariants}
                        animate="animate"
                        className="h-2.5 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded bg-[length:200%_100%] mb-1.5"
                      />
                      <motion.div
                        variants={shimmerVariants}
                        animate="animate"
                        className="h-3 w-1/2 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded bg-[length:200%_100%]"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
