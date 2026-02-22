import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function SplashScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center space-y-6"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative flex items-center justify-center w-20 h-20 bg-background border border-border rounded-2xl shadow-2xl">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-display font-bold text-foreground">
                        Homework Tracker ✨
                    </h2>
                    <p className="text-muted-foreground animate-pulse">
                        Syncing securely with Canvas...
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
