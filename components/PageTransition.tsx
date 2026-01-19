"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation"; // 关键引入

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // 获取当前路径

  return (
    <motion.div
      key={pathname} // 关键点：路径变更时，强制销毁并重新创建组件，触发 initial 动画
      initial={{ opacity: 0, x: 0, y: 20 }} // 稍微改一下效果：有一点点向上浮动
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 0, y: -20 }}
      transition={{
        duration: 0.7,
        ease: "easeInOut",
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
