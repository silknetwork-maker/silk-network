
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import UserAvatar from "../components/home/UserAvatar";
import SideMenu from "../components/home/SideMenu";
import NotificationPanel from "../components/home/NotificationPanel";
import BalanceCard from "../components/home/BalanceCard";
import CheckInButton from "../components/home/CheckInButton";
import ReferralCard from "../components/home/ReferralCard";
import { Loader2, Bell } from "lucide-react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      
      if (!currentUser.referral_code) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        await base44.auth.updateMe({ referral_code: code });
        return { ...currentUser, referral_code: code };
      }
      
      return currentUser;
    },
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.Settings.list(),
  });

  const { data: referralCount = 0 } = useQuery({
    queryKey: ["referralCount", user?.email],
    queryFn: async () => {
      if (!user?.referral_code) return 0;
      const users = await base44.entities.User.filter({
        referred_by: user.referral_code,
        kyc_status: "approved"
      });
      return users.length;
    },
    enabled: !!user?.referral_code,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.Notification.filter({ status: "active" }, "-created_date", 20),
    enabled: !!user,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    
    if (refCode && user && !user.referred_by) {
      base44.auth.updateMe({ referred_by: refCode });
    }
  }, [user]);

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const checkinReward = settings[0]?.checkin_reward || 0.1;
      const now = new Date().toISOString();
      await base44.auth.updateMe({
        last_checkin: now,
        tokens: (user.tokens || 0) + checkinReward
      });

      await base44.entities.Transaction.create({
        amount: checkinReward,
        type: "checkin",
        description: "Daily check-in reward"
      });

      queryClient.invalidateQueries(["currentUser"]);
    } catch (error) {
      console.error("Check-in error:", error);
    }
    setCheckInLoading(false);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header - Profile & Notification Icons */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <UserAvatar user={user} onClick={() => setMenuOpen(true)} />
          
          <button
            onClick={() => setNotificationOpen(true)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-lg border border-indigo-100 hover:shadow-xl transition-all"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <BalanceCard balance={user?.tokens || 0} />
        </motion.div>

        {/* Daily Check-In */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <CheckInButton
            lastCheckin={user?.last_checkin}
            onCheckIn={handleCheckIn}
            loading={checkInLoading}
          />
        </motion.div>

        {/* Referral Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ReferralCard
            referralCode={user?.referral_code}
            referralCount={referralCount}
          />
        </motion.div>
      </div>

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
      <NotificationPanel 
        isOpen={notificationOpen} 
        onClose={() => setNotificationOpen(false)} 
        notifications={notifications}
      />
    </div>
  );
}
