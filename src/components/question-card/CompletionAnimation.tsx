
import { motion, AnimatePresence } from "framer-motion";

interface CompletionAnimationProps {
  show: boolean;
}

const CompletionAnimation = ({ show }: CompletionAnimationProps) => {
  return (
    <AnimatePresence>
      {show && (
        <>
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 1,
                scale: 0,
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50
              }}
              animate={{ 
                opacity: 0,
                scale: Math.random() * 0.5 + 0.5,
                x: (Math.random() * 200 - 100),
                y: (Math.random() * 200 - 100)
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-blue-400/70 pointer-events-none"
            />
          ))}
          
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-blue-400/20 pointer-events-none rounded-lg"
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default CompletionAnimation;
