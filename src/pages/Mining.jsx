
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import MiningInterface from "../components/mining/MiningInterface";
import { Button } from "@/components/ui/button";
import { Play, Loader2, Info, Zap } from "lucide-react";

export default function Mining() {
  const [collecting, setCollecting] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.Settings.list(),
  });

  const miningReward = settings[0]?.mining_reward || 1;

  const handleStartMining = async () => {
    const now = new Date().toISOString();
    await base44.auth.updateMe({
      mining_started_at: now,
      mining_collected_at: now
    });
    queryClient.invalidateQueries(["currentUser"]);
  };

  const handleCollect = async () => {
    setCollecting(true);
    try {
      const now = new Date().toISOString();
      await base44.auth.updateMe({
        tokens: (user.tokens || 0) + miningReward,
        mining_started_at: now,
        mining_collected_at: now
      });

      await base44.entities.Transaction.create({
        amount: miningReward,
        type: "mining",
        description: "24-hour mining reward"
      });

      queryClient.invalidateQueries(["currentUser"]);
    } catch (error) {
      console.error("Collection error:", error);
    }
    setCollecting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const isMining = user?.mining_started_at;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 pt-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-black">Mining</h2>
          <p className="text-sm text-gray-700">Earn {miningReward} SILK every 24 hours</p>
        </motion.div>

        {isMining ? (
          <MiningInterface
            miningStartedAt={user.mining_started_at}
            onCollect={handleCollect}
            collecting={collecting}
            reward={miningReward}
          />
        ) : (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            {/* Info Card */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-black font-bold mb-3">How Mining Works</h3>
                  <ul className="text-gray-700 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span>Start mining to begin earning SILK tokens</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span>Mining runs for 24 hours automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span>Collect {miningReward} SILK when mining completes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span>Mining restarts automatically after collection</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Start Mining Card */}
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center border border-gray-200">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl"
              >
                <Zap className="w-16 h-16 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-black mb-3">Ready to Mine?</h2>
              <p className="text-gray-700 mb-8">
                Click the button below to start your 24-hour mining session and earn {miningReward} SILK
              </p>
              
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleStartMining}
                  className="w-full h-16 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-2xl text-white rounded-3xl"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Start Mining Now
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
