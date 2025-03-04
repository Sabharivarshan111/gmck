
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export const EmptyChatState = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center text-gray-500 py-6"
    >
      <div className="mb-2">
        <RefreshCw className="h-7 w-7 mx-auto opacity-50" />
      </div>
      <p>Ask me any medical question!</p>
      <p className="text-sm mt-1">I'm ACEV, your personal medical assistant</p>
    </motion.div>
  );
};
