
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import TransferForm from "../components/wallet/TransferForm";
import ReceiveSection from "../components/wallet/ReceiveSection";
import TransactionHistory from "../components/wallet/TransactionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet as WalletIcon, Loader2, Send, Download } from "lucide-react";
import SuccessToast from "../components/wallet/SuccessToast";

export default function Wallet() {
  const [transferring, setTransferring] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const allTxs = await base44.entities.Transaction.list("-created_date", 50);
      
      return allTxs.filter(tx => {
        if (tx.type === "transfer") {
          return tx.from_email === user.email || tx.to_email === user.email;
        }
        
        // For other types like mining, checkin, referral, or anything else
        // assume the 'created_by' field indicates the user involved.
        return tx.created_by === user.email;
      });
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const handleTransfer = async (toEmail, amount) => {
    setTransferring(true);
    setSuccessMessage("");
    
    try {
      const receiver = await base44.entities.User.filter({ email: toEmail });
      
      if (receiver.length === 0) {
        alert("User not found");
        setTransferring(false);
        return;
      }

      if (user.tokens < amount) {
        alert("Insufficient balance");
        setTransferring(false);
        return;
      }
      
      const receiverAmount = amount - 0.3;
      
      await base44.auth.updateMe({
        tokens: (user.tokens || 0) - amount
      });

      await base44.entities.User.update(receiver[0].id, {
        tokens: (receiver[0].tokens || 0) + receiverAmount
      });

      await base44.entities.Transaction.create({
        from_email: user.email,
        to_email: toEmail,
        amount: receiverAmount,
        fee: 0.3,
        type: "transfer",
        status: "success",
        description: `Transfer to ${toEmail}`,
        created_by: user.email
      });

      const adminPools = await base44.entities.AdminPool.list();
      if (adminPools.length > 0) {
        await base44.entities.AdminPool.update(adminPools[0].id, {
          total_fees: (adminPools[0].total_fees || 0) + 0.3,
          last_updated: new Date().toISOString()
        });
      } else {
        await base44.entities.AdminPool.create({
          total_fees: 0.3,
          last_updated: new Date().toISOString()
        });
      }

      queryClient.invalidateQueries(["currentUser"]);
      queryClient.invalidateQueries(["transactions"]);
      setSuccessMessage(`Successfully sent ${amount} SILK (${receiverAmount.toFixed(2)} SILK received by ${toEmail})`);
      
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Transfer error:", error);
      alert("Transfer failed. Please try again.");
    }
    
    setTransferring(false);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-black">Wallet</h2>
          <p className="text-sm text-gray-700">Send & receive SILK tokens</p>
        </motion.div>

        {/* Balance Display */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <WalletIcon className="w-6 h-6 text-indigo-600" />
            <span className="text-gray-700 text-sm font-medium">Available Balance</span>
          </div>
          <h2 className="text-4xl font-bold text-black">
            {(user?.tokens || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {" "}
            <span className="text-2xl text-indigo-600">
              SILK
            </span>
          </h2>
        </motion.div>

        {successMessage && <SuccessToast message={successMessage} />}

        {/* Send/Receive Tabs */}
        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-200">
            <TabsTrigger 
              value="send" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-gray-700"
            >
              <Send className="w-4 h-4" />
              <span className="font-semibold">Send</span>
            </TabsTrigger>
            <TabsTrigger 
              value="receive" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-gray-700"
            >
              <Download className="w-4 h-4" />
              <span className="font-semibold">Receive</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <TransferForm 
              user={user} 
              onTransfer={handleTransfer}
              loading={transferring}
            />
          </TabsContent>

          <TabsContent value="receive">
            <ReceiveSection userEmail={user?.email} />
          </TabsContent>
        </Tabs>

        {/* Transaction History */}
        <TransactionHistory 
          transactions={transactions} 
          userEmail={user?.email}
          loading={txLoading}
        />
      </div>
    </div>
  );
}
